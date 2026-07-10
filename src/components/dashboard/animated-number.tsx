'use client'

import { useEffect, useRef, useState } from 'react'

export function AnimatedNumber({
    value = 0,
    suffix = '',
    decimals = 0,
}: {
    value?: number
    suffix?: string
    decimals?: number
}) {
    const [display, setDisplay] = useState(0)
    const hasAnimated = useRef(false)

    useEffect(() => {
        if (hasAnimated.current) {
            setDisplay(value)
            return
        }
        hasAnimated.current = true
        const duration = 1500
        const steps = 60
        const increment = value / steps
        let current = 0
        let step = 0
        const timer = setInterval(() => {
            step++
            current = Math.min(
                Math.round(increment * step * Math.pow(10, decimals)) /
                Math.pow(10, decimals),
                value,
            )
            setDisplay(current)
            if (step >= steps) {
                setDisplay(value)
                clearInterval(timer)
            }
        }, duration / steps)
        return () => clearInterval(timer)
    }, [value, decimals])

    const formatted =
        decimals > 0
            ? Number(display).toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })
            : Math.round(display).toLocaleString()

    return (
        <span className="tabular-nums">
            {formatted}
            {suffix}
        </span>
    )
}
