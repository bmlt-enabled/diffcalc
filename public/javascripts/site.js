// Native `required` already blocks empty fields; this also rejects
// whitespace-only names, which the server would otherwise trim to "".
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
    });
});
