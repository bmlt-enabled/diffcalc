function validateFields() {
    var f = true;
    f = isBlank("FirstName","First Name", f);
    f = isBlank("LastName", "Last Initial", f);
    //f = isBlank("Email", "Email", f);
    return f;
}

function isBlank(id,lbl,f) {
    if (!f) {
        return f;
    }
    else {
        if ($("#" + id).val() == "") {
            alert(lbl + " is blank.");
            return false;
        }
        else {
            return true;
        }
    }
}