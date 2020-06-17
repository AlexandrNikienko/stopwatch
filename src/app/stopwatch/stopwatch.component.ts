import { Component, OnInit } from '@angular/core';
import { fromEvent, interval, merge, NEVER } from 'rxjs';
import { mapTo, scan, startWith, switchMap, tap, map, buffer, filter, debounceTime } from 'rxjs/operators';

interface State {
	count: boolean;
	value: number;
}

@Component({
	selector: 'app-stopwatch',
	templateUrl: './stopwatch.component.html',
	styleUrls: ['./stopwatch.component.scss']
})
export class StopwatchComponent implements OnInit {
	constructor() { }

	ngOnInit(): void {
		const getElem = (id: string): HTMLElement => document.getElementById(id);

		const fromClick = (id: string) => fromEvent(getElem(id), 'click');

		const fromClickAndMapTo = (id: string, obj: {}) => fromClick(id).pipe(mapTo(obj));

		const fromDoubleClickAndMapTo = (id: string, obj: {}) => fromClick(id).pipe(
			buffer(fromClick(id).pipe(debounceTime(300))),
			map(clicks => clicks.length),
			filter(clicksLength => clicksLength === 2),
			mapTo(obj)
		);;

		const setValue = (val: string | number) => (getElem('counter').innerText = val.toString());

		const events$ = merge(
			fromClickAndMapTo('start', { count: true }),
			fromClickAndMapTo('stop', { value: 0, count: false }),
			fromDoubleClickAndMapTo('wait', { count: false }),
			fromClickAndMapTo('reset', { value: 0 })
		);

		const stopWatch$ = events$.pipe(
			startWith({
				count: false,
				value: 0
			}),
			scan((state: State, curr): State => ({ ...state, ...curr }), {}),
			tap((state: State) => setValue(this.stopwatchDisplay(state.value))),
			switchMap((state: State) =>
				state.count
					? interval(1000).pipe(
						tap(() => {
							state.value += 1;
							setValue(this.stopwatchDisplay(state.value));
						})
					)
					: NEVER
			)
		);

		stopWatch$.subscribe();
	}

	stopwatchDisplay(sec: number): string {
		const seconds = this.addZeroPrefix(Math.floor(sec % 60)),
			minutes = this.addZeroPrefix(Math.floor(sec / 60) % 60),
			hours = this.addZeroPrefix(Math.floor(sec / 3600));
		return hours + ":" + minutes + ":" + seconds;
	}

	addZeroPrefix(num: number): string {
		return num < 10 ? '0' + num : num.toString();
	}
}
