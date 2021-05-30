const router = require('express').Router();
const {MessageMedia, Location} = require("whatsapp-web.js");
const request = require('request')
const vuri = require('valid-url');
const fs = require(' fs');

const mediadownloader = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

const SendAndLogError = (exception, response, code = 400) => {
    console.error(exception);
    response.statusCode = code;
    response.send({status: "error", message: "Something went wrong"})
}

router.post('/sendmessage/:phone', async (request, response) => {
    let phone = request.params.phone;
    let message = request.body.message;

    if (phone === undefined || message === undefined) {
        response.send({status: "error", message: "please enter valid phone and message"})
    } else {
        client.sendMessage(phone + '@c.us', message).then((res) => {
            if (res.id.fromMe) {
                response.send({status: 'success', message: `Message successfully sent to ${phone}`})
            }
        });
    }
});

router.post('/sendimage/:phone', async (request, response) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = request.params.phone;
    let image = request.body.image;
    let caption = request.body.caption;

    if (phone === undefined || image === undefined) {
        response.send({status: "error", message: "please enter valid phone and base64/url of image"})
    } else {
        if (base64regex.test(image)) {
            let media = new MessageMedia('image/png', image);
            client.sendMessage(`${phone}@c.us`, media, {caption: caption || ''}).then((res) => {
                if (res.id.fromMe) {
                    response.send({status: 'success', message: `MediaMessage successfully sent to ${phone}`})
                }
            });
        } else if (vuri.isWebUri(image)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }

            var path = './temp/' + image.split("/").slice(-1)[0]
            mediadownloader(image, path, () => {
                let media = MessageMedia.fromFilePath(path);

                client.sendMessage(`${phone}@c.us`, media, {caption: caption || ''}).then((res) => {
                    if (res.id.fromMe) {
                        response.send({status: 'success', message: `MediaMessage successfully sent to ${phone}`})
                        fs.unlinkSync(path)
                    }
                });
            })
        } else {
            response.send({status: 'error', message: 'Invalid URL/Base64 Encoded Media'})
        }
    }
});

router.post('/sendpdf/:phone', async (request, response) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = request.params.phone;
    let pdf = request.body.pdf;

    if (phone === undefined || pdf === undefined) {
        response.send({status: "error", message: "please enter valid phone and base64/url of pdf"})
    } else {
        if (base64regex.test(pdf)) {
            let media = new MessageMedia('application/pdf', pdf);
            client.sendMessage(`${phone}@c.us`, media).then((response) => {
                if (response.id.fromMe) {
                    response.send({status: 'success', message: `MediaMessage successfully sent to ${phone}`})
                }
            });
        } else if (vuri.isWebUri(pdf)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }

            var path = './temp/' + pdf.split("/").slice(-1)[0]
            mediadownloader(pdf, path, () => {
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(`${phone}@c.us`, media).then((response) => {
                    if (response.id.fromMe) {
                        response.send({status: 'success', message: `MediaMessage successfully sent to ${phone}`})
                        fs.unlinkSync(path)
                    }
                });
            })
        } else {
            response.send({status: 'error', message: 'Invalid URL/Base64 Encoded Media'})
        }
    }
});

router.post('/sendlocation/:phone', async (request, response) => {
    let phone = request.params.phone;
    let latitude = request.body.latitude;
    let longitude = request.body.longitude;
    let desc = request.body.description;

    if (phone === undefined || latitude === undefined || longitude === undefined) {
        response.send({status: "error", message: "please enter valid phone, latitude and longitude"})
    } else {
        let loc = new Location(latitude, longitude, desc || "");
        client.sendMessage(`${phone}@c.us`, loc).then((response) => {
            if (response.id.fromMe) {
                response.send({status: 'success', message: `MediaMessage successfully sent to ${phone}`})
            }
        });
    }
});

router.get('/getchatbyid/:phone', async (request, response) => {
    let phone = request.params.phone;
    if (phone === undefined) {
        response.send({status: "error", message: "please enter valid phone number"});
    } else {
        client.getChatById(`${phone}@c.us`).then((chat) => {
            response.send({status: "success", message: chat});
        }).catch((exception) => {
            SendAndLogError(exception, response);
        })
    }
});

router.get('/getmessagesbyid/:phone', async (request, response) => {
    let phone = request.params.phone;
    let setSeen = request.query.setSeen
    if (phone === undefined) {
        response.send({status: "error", message: "please enter valid phone number"});
    } else {
        client.getChatById(`${phone}@c.us`).then((chat) => {
            chat.fetchMessages({limit: 100}).then((messages) => {
                response.send({status: "success", message: messages});
            });

            if (setSeen === 'true') {
                console.log('set seen');
                chat.sendSeen();
            }
        }).catch((exception) => {
            SendAndLogError(exception, response);
        })
    }
});

router.get('/setseen/:phone', async (request, response) => {
    let phone = request.params.phone;
    if (phone === undefined) {
        response.send({status: "error", message: "please enter valid phone number"});
    } else {
        client.getChatById(`${phone}@c.us`).then((chat) => {
            chat.sendSeen().then(() => {
                response.send({status: "success"});
            });
        }).catch((exception) => {
            SendAndLogError(exception, response);
        })
    }
});

router.get('/getchats', async (request, response) => {
    client.getChats().then((chats) => {
        response.send({status: "success", message: chats});
    }).catch((exception) => {
        SendAndLogError(exception, response);
    })
});

module.exports = router;