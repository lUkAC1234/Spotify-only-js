from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class DefaultPagination(LimitOffsetPagination):
    default_limit = 24
    max_limit = 100
    limit_query_param = "limit"
    offset_query_param = "offset"

    def get_paginated_response(self, data) -> Response:
        return Response(
            OrderedDict(
                [
                    ("items", data),
                    ("total", self.count),
                    ("limit", self.limit),
                    ("offset", self.offset),
                ]
            )
        )
