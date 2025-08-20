import {
    ITrueFitEventRelaying,
    TrueFitEvent,
    TrueFitEventListener,
    TrueFitEventTypes,
} from "."

/**
 * Custom event relay whose dispatching can be awaited
 */
export default class AwaitableEventRelaying implements ITrueFitEventRelaying {
    private listeners = new Map<TrueFitEventTypes, TrueFitEventListener[]>()

    async dispatchEvent(event: TrueFitEvent): Promise<void> {
        await Promise.all(
            this.listeners.get(event.type)?.map((l) => l(event)) ?? [],
        )
    }

    listenForEvents(
        eventTypes: TrueFitEventTypes[],
        listener: TrueFitEventListener,
    ): void {
        for (const t of eventTypes) {
            const arr = this.listeners.get(t)
            if (arr) {
                arr.push(listener)
            } else {
                this.listeners.set(t, [listener])
            }
        }
    }
}
