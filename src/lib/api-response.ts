/**
 * SpeakLife AI — Unified API Response Contract
 * Standardizes success and error JSON envelopes across all API endpoints.
 * Prevents stack trace leakages and raw database error exposure.
 */

import { NextResponse } from "next/server";

export interface ApiSuccessPayload<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function apiSuccess<T>(data: T, status: number = 200, meta?: Record<string, any>) {
  return NextResponse.json<ApiSuccessPayload<T>>(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json<ApiErrorPayload>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}
