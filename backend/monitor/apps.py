import os
import sys

from django.apps import AppConfig

NON_SERVING_COMMANDS = {
    'migrate',
    'makemigrations',
    'shell',
    'test',
    'createsuperuser',
    'collectstatic',
    'check',
    'showmigrations',
    'dbshell',
}


class MonitorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'monitor'

    def ready(self):
        if any(cmd in sys.argv for cmd in NON_SERVING_COMMANDS):
            return

        # The dev autoreloader forks a watcher process before the one that
        # actually serves requests; only the child (which sets RUN_MAIN) should
        # start the scheduler. This check is a no-op for gunicorn/WSGI, where
        # RUN_MAIN is never set and 'runserver' never appears in argv.
        using_autoreload = 'runserver' in sys.argv and '--noreload' not in sys.argv
        if using_autoreload and os.environ.get('RUN_MAIN') != 'true':
            return

        from .scheduler import start_scheduler

        start_scheduler()
