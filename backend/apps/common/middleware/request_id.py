import secrets

REQUEST_ID_HEADER = "HTTP_X_REQUEST_ID"
RESPONSE_HEADER = "X-Request-Id"


class RequestIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.META.get(REQUEST_ID_HEADER) or secrets.token_hex(8)
        request.request_id = request_id
        response = self.get_response(request)
        response[RESPONSE_HEADER] = request_id
        return response
