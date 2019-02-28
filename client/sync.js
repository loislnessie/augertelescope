const SerialPort = require('serialport')
const fs = require('fs')

const MEASUREMENT_TIME = 10000 * 6 // 60s
const OPTIMAL_EVENTS_PER_SECOND = 7
const START_THRESHOLD = 300
const MAX_PERCENTUAL_DIFFERENCE = 10
const STEP_SIZE = 10

let i = 0

module.exports = function(iterations) {
	return new Promise((resolve, reject) => {
		const cards = {}

		const devFiles = fs.readdirSync('/dev/')

		for (let file of devFiles) {
			if (file.startsWith('ttyUSB')) {
				cards[file] = {
					count      : 0,
					connection : new SerialPort('/dev/' + file, {
						baudRate : 115200
					}),
					threshold  : 0,
					name       : file
				}
			}
		}

		const forEachCard = (callback) => Object.keys(cards).forEach((name) => callback(cards[name]))

		const sendCommand = (cmd) => forEachCard((card) => card.connection.write(cmd + '\r'))
		const enableCounter = () => sendCommand('CE')
		const disableCounter = () => sendCommand('CD')

		disableCounter()

		forEachCard((card) => {
			card.connection.on('data', (data) => {
				data = data.toString()
				// console.log(data)
				if (data.startsWith('CE') || data.startsWith('CD')) return
				else if (data.startsWith('TL ')) {
					console.log(card.name + '   ' + data.replace('TL 4 ', ''))
					card.threshold = Number.parseInt(data.replace('TL 4 ', ''))
				} else card.count++

				// if (data.startsWith('TL 4')) {
				// console.log('card ' + card.name + ' th to ' + data.replace('TL 4 ', ''))
				// card.threshold = Number.parseFloat(data.replace('TL 4 ', ''))
			})
		})

		sendCommand('TL 4 ' + startMeasurement)

		function startMeasurement() {
			// console.log('Starting measurements')
			// console.log(cards)

			enableCounter()

			setTimeout(() => {
				disableCounter()

				setTimeout(() => {
					forEachCard((card) => {
						const count = card.count
						const eventsPerSecond = count / (MEASUREMENT_TIME / 1000)

						let diff =
							100 *
							Math.abs(
								(eventsPerSecond - OPTIMAL_EVENTS_PER_SECOND) /
									((eventsPerSecond + OPTIMAL_EVENTS_PER_SECOND) / 2)
							)
						if (eventsPerSecond > OPTIMAL_EVENTS_PER_SECOND) diff *= -1

						console.log(
							card.name +
								'(' +
								card.threshold +
								'): ' +
								count +
								' events in ' +
								MEASUREMENT_TIME / 1000 +
								's = ' +
								eventsPerSecond +
								' events per s = ' +
								diff +
								'%'
						)

						if (Math.abs(diff) >= MAX_PERCENTUAL_DIFFERENCE) {
							//wenn die differenz größer als 10% ist
							// console.log('new threshold = ' + (START_THRESHOLD * ((100 - diff) / 100)))
							if (diff < 0) {
								console.log('incresing th from ' + card.threshold)
								card.connection.write('TL 4 ' + (card.threshold + STEP_SIZE) + '\r')
							} else {
								console.log('decreasing th from ' + card.threshold)
								card.connection.write('TL 4 ' + (card.threshold - STEP_SIZE) + '\r')
							}
							// card.connection.write('TL 4 ' + Math.floor(START_THRESHOLD * ((100 - diff) / 100)) + '\r')
						}

						card.count = 0
					})

					console.log('\n')
					i++
					if (i < iterations) setTimeout(startMeasurement, 1000)
					else return resolve(cards['ttyUSB0'].threshold)
				}, 1000)
				// startMeasurement()
			}, MEASUREMENT_TIME)
		}

		setTimeout(startMeasurement, 150)
	})
}
