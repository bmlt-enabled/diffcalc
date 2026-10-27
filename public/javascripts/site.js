// Native `required` already blocks empty fields; this also rejects
// whitespace-only names, which the server would otherwise trim to "",
// and clean dates that don't exist (Feb 31) or are in the future.
document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('cleantime-form');
    if (!form) {
        return;
    }

    var fields = [
        { id: 'FirstName', label: 'First name' },
        { id: 'LastName', label: 'Last initial' }
    ];

    fields.forEach(function(field) {
        var input = document.getElementById(field.id);
        input.addEventListener('input', function() {
            input.setCustomValidity('');
        });
    });

    var month = document.getElementById('month');
    var day = document.getElementById('day');
    var year = document.getElementById('year');

    [month, day, year].forEach(function(select) {
        select.addEventListener('change', function() {
            day.setCustomValidity('');
        });
    });

    function dateError() {
        var y = parseInt(year.value, 10);
        var m = parseInt(month.value, 10) - 1;
        var d = parseInt(day.value, 10);
        var date = new Date(y, m, d);

        if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
            return 'Clean date is not a real date.';
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
            return 'Clean date cannot be in the future.';
        }

        return '';
    }

    form.addEventListener('submit', function(event) {
        for (var i = 0; i < fields.length; i++) {
            var input = document.getElementById(fields[i].id);
            if (input.value.trim() === '') {
                input.setCustomValidity(fields[i].label + ' is blank.');
                input.reportValidity();
                event.preventDefault();
                return;
            }
        }

        var message = dateError();
        if (message) {
            day.setCustomValidity(message);
            day.reportValidity();
            event.preventDefault();
        }
    });
});
