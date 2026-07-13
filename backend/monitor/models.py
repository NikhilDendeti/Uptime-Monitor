from django.db import models


class MonitoredUrl(models.Model):
    url = models.URLField(max_length=2048)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return self.url


class Check(models.Model):
    url = models.ForeignKey(MonitoredUrl, related_name='checks', on_delete=models.CASCADE)
    status_code = models.IntegerField(null=True, blank=True)
    response_ms = models.IntegerField(null=True, blank=True)
    is_up = models.BooleanField()
    error_message = models.TextField(null=True, blank=True)
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-checked_at']
        indexes = [models.Index(fields=['url', 'checked_at'])]
