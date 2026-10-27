var moment = require("moment");
var monthDay = [ 31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
var _this = this;

var self = {
    // A clean date must be a real calendar date (no Feb 31) and not after today.
    'isValidCleanDate' : function(year, month, day) {
        var y = Number(year), m = Number(month), d = Number(day);
        if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
            return false;
        }

        var date = moment([y, m - 1, d]);
        return date.isValid() && !date.isAfter(moment(), 'day');
    },

    'calculate' : function(year, month, day) {
        // invalid or future dates have no clean time to report
        if (!self.isValidCleanDate(year, month, day)) {
            return null;
        }

        // calculate the time
        var fromDate, toDate, daysBetween, monthsBetween, yearsBetween;
        var startDate = moment([Number(year), Number(month) - 1, Number(day)]);
        var endDate = moment();

        fromDate = startDate;
        toDate = endDate;

        var increment = 0;

        if (fromDate.date() > toDate.date()) {
            increment = monthDay[fromDate.month()];
        }

        if (increment == -1) {
            increment = fromDate.isLeapYear() ? 29 : 28;
        }

        if (increment !== 0) {
            daysBetween = (toDate.date() + increment) - fromDate.date();
            increment = 1;
        } else {
            daysBetween = toDate.date() - fromDate.date();
        }

        if ((fromDate.month() + increment) > toDate.month()) {
            monthsBetween = (toDate.month() + 12) - (fromDate.month() + increment);
            increment = 1;
        } else {
            monthsBetween = (toDate.month() - (fromDate.month() + increment));
            increment = 0;
        }

        yearsBetween = toDate.year() - (fromDate.year() + increment);

        var totaldaysDiff = endDate.diff(startDate, 'days');

        return {
            "years" : yearsBetween,
            "months" : monthsBetween,
            "days" : daysBetween,
            "totalDays" : totaldaysDiff
        };
    },

    'grandTotal': function(data) {
        var years = 0;
        var months = 0;
        var days = 0;
        var totalDays = 0;

        if (data == null) return {
            days: 0,
            months: 0,
            years: 0,
            totalDays: 0
        };

        Object.keys(data).forEach(function(key) {
            var val = JSON.parse(data[key]);
            var calculated = self.calculate(val.year, val.month, val.day);

            if (calculated === null) {
                console.warn("Skipping record with invalid or future clean date: " + key);
                return;
            }

            days += calculated.days;
            months += calculated.months;
            years += calculated.years;
            totalDays += calculated.totalDays;
        });

        if (days >= 30) {
            var addDays = days % 30;
            months += (days / 30);
            days = addDays;
        }

        if (months > 12) {
            var addMonths = months % 12;
            years += (months / 12);
            months = addMonths;
        }

        return {
            days: days,
            months: Math.floor(months),
            years: Math.floor(years),
            totalDays: totalDays
        };
    }
};

module.exports = self;