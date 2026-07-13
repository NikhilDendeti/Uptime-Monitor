import json

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods

from .models import Check, MonitoredUrl

url_validator = URLValidator(schemes=['http', 'https'])


def health(request):
    return JsonResponse({'status': 'ok'})


def serialize_monitor(monitor: MonitoredUrl) -> dict:
    latest = monitor.checks.order_by('-checked_at').first()
    return {
        'id': monitor.id,
        'url': monitor.url,
        'createdAt': monitor.created_at.isoformat(),
        'status': 'pending' if latest is None else ('up' if latest.is_up else 'down'),
        'statusCode': latest.status_code if latest else None,
        'responseMs': latest.response_ms if latest else None,
        'lastCheckedAt': latest.checked_at.isoformat() if latest else None,
        'errorMessage': latest.error_message if latest else None,
    }


def serialize_check(check: Check) -> dict:
    return {
        'id': check.id,
        'urlId': check.url_id,
        'statusCode': check.status_code,
        'responseMs': check.response_ms,
        'isUp': check.is_up,
        'errorMessage': check.error_message,
        'checkedAt': check.checked_at.isoformat(),
    }


@require_http_methods(['GET', 'POST'])
def list_create_urls(request):
    if request.method == 'GET':
        monitors = MonitoredUrl.objects.all().prefetch_related('checks')
        return JsonResponse([serialize_monitor(m) for m in monitors], safe=False)

    try:
        body = json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    url = body.get('url') if isinstance(body, dict) else None
    if not isinstance(url, str):
        return JsonResponse({'error': 'A valid http(s) URL is required'}, status=400)

    try:
        url_validator(url)
    except ValidationError:
        return JsonResponse({'error': 'A valid http(s) URL is required'}, status=400)

    monitor = MonitoredUrl.objects.create(url=url)
    return JsonResponse(
        {'id': monitor.id, 'url': monitor.url, 'createdAt': monitor.created_at.isoformat()},
        status=201,
    )


@require_http_methods(['GET'])
def url_checks(request, id):
    checks = Check.objects.filter(url_id=id).order_by('-checked_at')[:50]
    return JsonResponse([serialize_check(c) for c in checks], safe=False)


@require_http_methods(['DELETE'])
def url_detail(request, id):
    deleted, _ = MonitoredUrl.objects.filter(id=id).delete()
    if not deleted:
        return JsonResponse({'error': 'Not found'}, status=404)
    return HttpResponse(status=204)
