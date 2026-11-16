"use client";

import { useEffect } from "react";
import { captureSource } from "@/lib/attribution";

/** 첫 방문 유입 경로를 기록한다(문의 폼에서 함께 전송). 화면에는 아무것도 그리지 않는다. */
export function SourceTracker() {
  useEffect(() => captureSource(), []);
  return null;
}
