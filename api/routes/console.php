<?php

use Illuminate\Support\Facades\Schedule;

/*
 * Scheduled work. In production a single cron entry runs `schedule:run` every
 * minute and Laravel decides which of these are due. That keeps all recurring
 * work described in code rather than scattered across server crontabs.
 */

// Refresh the cached network statistics so the dashboard never waits for the
// expensive aggregate query itself.
Schedule::command('northline:refresh-stats')->everyFiveMinutes()->withoutOverlapping();
