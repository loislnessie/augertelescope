require('dotenv').config()

const API_ROUTE = process.env.API_ROUTE || '{your_api_route}'
const API_KEY = process.env.API_KEY || '{your_api_key}'
const LIMIT = process.env.LIMIT || 5000

const axios = require('axios')

const SerialPort = require('serialport')

const SYNC_ITERATIONS = 10

require('./sync')(SYNC_ITERATIONS)
	.then((threshold) => {
		const port = new SerialPort('/dev/ttyUSB0', {
			baudRate : 115200
		})

		const startupRoutine = ['TL 4 ' + threshold, 'CE']

		let cache = []
		let unfullfilled = ''

		const pattern = /[0-9A-F]{8}\s([0-9A-F]{2}\s){2}(00\s){6}[0-9A-F]{8}\s\d{3,6}\.\d{2,3}\s\d{3,6}\s[VA]\s\d{2} \d{1}\s[+-]\d{3,4}/i

		setTimeout(() => {
			console.log('listening')
			port.on('data', (data) => {
				data = data.toString().replace(/\r/g, '').split('\n')

				if (data[data.length - 1] === '') data.pop()

				for (let line of data) {
					if (pattern.test(line)) {
						cache.push(line)
					} else {
						unfullfilled += line

						if (pattern.test(unfullfilled)) {
							cache.push(unfullfilled)
							unfullfilled = ''
						}
					}
				}

				if (cache.length >= LIMIT) {
					const copy = cache
					cache = []
					const url = API_ROUTE + '/' + API_KEY + '/data'
					axios.post(url, {raws: copy})
				}
			})
		}, 1000)

		for (let command of startupRoutine) {
			port.write(command + '\r', (err) => {
				if (err) console.error(err)
			})
		}
	})
	.catch((err) => {
		console.error(err)
	})
