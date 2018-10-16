import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

@Injectable()
export class Clock {

  private clock: Observable<any>;
  private seconds: number = 0;
  private minutes: number = 0;
  private hours: number = 0;

  constructor() {
    this.clock = Observable.interval( 1000 ).map( tick => {
      
      this.seconds++;

      if ( this.seconds >= 60 ) {
        this.minutes++;
        this.seconds = 0;
      }

      if ( this.minutes >= 60 ) {
        this.hours++;
        this.minutes = 0;
      }

      return { 
        seconds: this.formatTime( this.seconds ), 
        minutes: this.formatTime( this.minutes ), 
        hours: this.formatTime( this.hours )
      };
    } ).share();
  }

  resetClock() {
    this.seconds = 0;
    this.minutes = 0;
    this.hours = 0;
    
    return { 
      seconds: this.formatTime( this.seconds ), 
      minutes: this.formatTime( this.minutes ), 
      hours: this.formatTime( this.hours )
    };
  }

  getClock(): Observable<any> {
    return this.clock;
  }

  formatTime ( time ) {
    return ( time < 10 ) ? time = '0'+ time : time.toString();
  }
}
