const request = require('superagent');
var { from, key, app, to } = require('yargs').argv;

var wait = false;
to = to.trim('/')
from = from.trim('/')

const fromHeaders = {
    'X-Parse-Application-Id': app[0],
    'X-Parse-Master-Key': key[0]
}

const toHeaders = {
    'X-Parse-Application-Id': app[1],
    'X-Parse-Master-Key': key[1]
}

var index = 0;
console.log(from, " ", key, " ", app, " ", to)

request.get(from + '/schemas/')
    .set(fromHeaders)
    .then(({body: { results }}) => {
        return results.reduce((promise, schema) => {
            delete schema.fields.objectId;
            delete schema.fields.createdAt;
            delete schema.fields.updatedAt;
            delete schema.fields.ACL;
            let className = schema.className

            return promise.then(res => {
                console.log("Checking if " + className + " exists");
                return request.get(to + "/schemas/" + className)
                        .set(toHeaders)
            })
            .then(({ body }) => {
                console.log(className + " class exists. attempting update");
                let newFields = {};
                for(let f in body.fields) {
                    delete schema.fields[f];
                }

                return "put"
            }, err => {
                if (err.response.statusCode == 400) {
                    console.log(className + " doesn't exist. attempting create")
                    return "post"
                }
            })
            .then(method => {
                console.log("Attempting to " + method + " " + className)
                return request[method](to + '/schemas/' + schema.className)
                    .set(toHeaders)
                    .send(schema)
            })
            .then(res => {
                    console.log("Finished migrating " + className)
                    return null
                },
                err => { 
                    console.error("Error migrating " + className + ": " + err.response.body.error)
                    return null
                });
        }, Promise.resolve(null))
    }).then(res => {
        console.log("Done!")
    }, err => {
        console.error("An error occured: " + err.message);
    })