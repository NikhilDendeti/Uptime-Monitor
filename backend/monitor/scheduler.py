import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from django.conf import settings

from .models import MonitoredUrl
from .pinger import check_url

logger = logging.getLogger(__name__)

_scheduler = None


def run_all_checks() -> None:
    urls = list(MonitoredUrl.objects.values_list('id', 'url'))
    if not urls:
        return

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = [pool.submit(check_url, url_id, url) for url_id, url in urls]
        for future in futures:
            try:
                future.result()
            except Exception:
                logger.exception('[scheduler] a check failed')


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return

    from apscheduler.schedulers.background import BackgroundScheduler

    interval = settings.CHECK_INTERVAL_SECONDS
    logger.info('[scheduler] checking all URLs every ~%ss', interval)

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        run_all_checks,
        'interval',
        seconds=interval,
        id='run_all_checks',
        max_instances=1,
        next_run_time=datetime.now(),  # also fire once immediately on boot
    )
    _scheduler.start()
