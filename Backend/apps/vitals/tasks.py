from celery import shared_task
from django.utils import timezone
from django.db.models import Avg, Min, Max
from django.db.models.functions import TruncMinute, TruncHour
from datetime import timedelta
from apps.vitals.models import Vital, VitalArchive, VitalSummary
import logging

logger = logging.getLogger("vitals")

@shared_task
def drop_all_vitals_periodic():
    """
    🧹 PERIODIC TRUNCATION
    Drops all Vital, Archive, and Summary records every 10 minutes.
    Requested for system reset/cleanliness.
    """
    v_count, _ = Vital.objects.all().delete()
    a_count, _ = VitalArchive.objects.all().delete()
    s_count, _ = VitalSummary.objects.all().delete()
    logger.info(f"System Reset: Dropped {v_count} vitals, {a_count} archives, {s_count} summaries.")
    return f"Dropped {v_count} vitals."

@shared_task
def archive_hot_vitals(retention_hours=4):
    """
    🌪️ HOT -> WARM TRANSITION
    Aggregates 1-second pulse data into 1-minute trend archives.
    Preserves clinical spikes (Min/Max).
    """
    try:
        threshold = timezone.now() - timedelta(hours=retention_hours)
        
        # 1. Identify raw data eligible for archiving
        stale_vitals = Vital.objects.filter(recorded_at__lt=threshold)
        if not stale_vitals.exists():
            return "No hot data to archive."

        # 2. Group by device and minute, calculate clinical aggregates
        aggregates = stale_vitals.annotate(
            minute=TruncMinute('recorded_at')
        ).values('device_id', 'patient_id', 'minute', 'source').annotate(
            hr_min=Min('heart_rate'),
            hr_max=Max('heart_rate'),
            hr_avg=Avg('heart_rate'),
            spo2_min=Min('spo2'),
            spo2_max=Max('spo2'),
            spo2_avg=Avg('spo2'),
            temp_avg=Avg('temperature'),
            sys_avg=Avg('systolic_bp'),
            dia_avg=Avg('diastolic_bp')
        )

        # 3. Batch Create Archive Records
        archives_to_create = []
        for agg in aggregates:
            archives_to_create.append(VitalArchive(
                device_id=agg['device_id'],
                patient_id=agg['patient_id'],
                recorded_at=agg['minute'],
                data_type=agg['source'], # Map Source to DataType
                hr_min=agg['hr_min'],
                hr_max=agg['hr_max'],
                hr_avg=agg['hr_avg'],
                spo2_min=agg['spo2_min'],
                spo2_max=agg['spo2_max'],
                spo2_avg=agg['spo2_avg'],
                temp_avg=agg['temp_avg'],
                systolic_avg=agg['sys_avg'],
                diastolic_avg=agg['dia_avg']
            ))
        
        VitalArchive.objects.bulk_create(archives_to_create, ignore_conflicts=True)
        
        # 4. Safe Purge of Hot Data
        count = stale_vitals.count()
        stale_vitals.delete()
        
        logger.info(f"Waterfall: Archived {count} pulse records into {len(archives_to_create)} minute trends.")
        return f"Archived {count} records."

    except Exception as e:
        logger.error(f"Waterfall Failure (Hot->Warm): {str(e)}")
        return str(e)


@shared_task
def summarize_warm_vitals(retention_hours=24):
    """
    🌥️ WARM -> COLD TRANSITION
    Aggregates 1-minute trends into 1-hour audit summaries.
    """
    try:
        threshold = timezone.now() - timedelta(hours=retention_hours)
        stale_archives = VitalArchive.objects.filter(recorded_at__lt=threshold)
        
        if not stale_archives.exists():
            return "No warm data to summarize."

        # Group by device and hour
        aggregates = stale_archives.annotate(
            hour=TruncHour('recorded_at')
        ).values('device_id', 'hour', 'data_type').annotate(
            hr_min=Min('hr_min'),
            hr_max=Max('hr_max'),
            hr_avg=Avg('hr_avg'),
            spo2_min=Min('spo2_min'),
            spo2_max=Max('spo2_max'),
            spo2_avg=Avg('spo2_avg')
        )

        summaries_to_create = [
            VitalSummary(
                device_id=agg['device_id'],
                recorded_at=agg['hour'],
                data_type=agg['data_type'],
                hr_min=agg['hr_min'],
                hr_max=agg['hr_max'],
                hr_avg=agg['hr_avg'],
                spo2_min=agg['spo2_min'],
                spo2_max=agg['spo2_max'],
                spo2_avg=agg['spo2_avg']
            ) for agg in aggregates
        ]

        VitalSummary.objects.bulk_create(summaries_to_create, ignore_conflicts=True)
        
        count = stale_archives.count()
        stale_archives.delete()
        
        return f"Summarized {count} minutes into {len(summaries_to_create)} hourly audits."

    except Exception as e:
        logger.error(f"Waterfall Failure (Warm->Cold): {str(e)}")
        return str(e)


@shared_task
def cleanup_cold_data(days=30):
    """
    ❄️ FINAL PURGE
    Removes hourly summaries older than 30 days.
    """
    threshold = timezone.now() - timedelta(days=days)
    count, _ = VitalSummary.objects.filter(recorded_at__lt=threshold).delete()
    return f"Purged {count} old summaries."
