require('dotenv').config()

const axios = require('axios')

const SerialPort = require('serialport')
const port = new SerialPort('/dev/ttyUSB0', {
	baudRate : 115200
})

const startupRoutine = ['CE']

let cache = []
let unfullfilled = ''

const pattern = /[0-9A-F]{8}\s([0-9A-F]{2}\s){2}(00\s){6}[0-9A-F]{8}\s\d{3,6}\.\d{2,3}\s\d{3,6}\s[VA]\s\d{2} \d{1}\s[+-]\d{3,4}/i

setTimeout(() => {
	// setInterval(() => {
	// 	console.log('scanning')
	// 	if (cache.length >= 50) {
	// 		const copy = cache
	// 		cache = []
	// 		const url = process.env.API_ROUTE + '/' + process.env.API_KEY + '/data'
	// 		axios.post(url, {raws: copy})
	// 	}
	// }, 15 * 1000)

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

		if (cache.length >= process.env.LIMIT) {
			const copy = cache
			cache = []
			const url = process.env.API_ROUTE + '/' + process.env.API_KEY + '/data'
			axios.post(url, {raws: copy})
		}
	})
}, 1000)

for (let command of startupRoutine) {
	port.write(command + '\r', (err) => {
		if (err) console.error(err)
	})
}
