class CanvasManager {
	constructor() {
		this.canvas = document.getElementById('plot')
		this.ctx = this.canvas.getContext('2d')

		// Создаем отдельный канвас для фона
		this.bgCanvas = document.createElement('canvas')
		this.bgCtx = this.bgCanvas.getContext('2d')

		this.setupCanvas()
		this.setupMouseEvents()

		// Флаг необходимости перерисовки фона
		this.backgroundNeedsUpdate = true

		// Размер шага сетки фона
		this.gridStep = 10

		// Цвета для разных классов
		this.colors = {
			1: { solid: '#2196F3', light: 'rgba(33, 150, 243, 0.3)' }, // синий
			2: { solid: '#F44336', light: 'rgba(244, 67, 54, 0.3)' }, // красный
			3: { solid: '#4CAF50', light: 'rgba(76, 175, 80, 0.3)' }, // зеленый
		}

		// Размер точек
		this.pointRadius = 6

		// Текущая позиция мыши
		this.mouseX = null
		this.mouseY = null

		// Выбранная точка
		this.selectedPoint = null
		this.isDragging = false

		// Throttle для обновления при движении мыши
		this.throttleTimeout = null

		// Добавляем параметры для стрелок
		this.arrowHeadLength = 10
		this.arrowHeadAngle = Math.PI / 6 // 30 градусов
	}

	setupCanvas() {
		// Устанавливаем размеры канваса
		const resizeCanvas = () => {
			const rect = this.canvas.getBoundingClientRect()
			this.canvas.width = rect.width
			this.canvas.height = rect.height
			this.bgCanvas.width = rect.width
			this.bgCanvas.height = rect.height
			this.backgroundNeedsUpdate = true
			if (this.knn) {
				this.redraw(this.knn)
			}
		}

		// Вызываем при загрузке и изменении размера окна
		window.addEventListener('resize', resizeCanvas)
		resizeCanvas()
	}

	setupMouseEvents() {
		// Обработка наведения мыши
		this.canvas.addEventListener('mousemove', e => {
			const rect = this.canvas.getBoundingClientRect()
			this.mouseX = (e.clientX - rect.left) / this.canvas.width
			this.mouseY = (e.clientY - rect.top) / this.canvas.height

			if (this.isDragging && this.selectedPoint) {
				this.selectedPoint.x = this.mouseX
				this.selectedPoint.y = this.mouseY
				this.backgroundNeedsUpdate = true
			}

			// Throttle обновления при движении мыши
			if (!this.throttleTimeout) {
				this.throttleTimeout = setTimeout(() => {
					if (this.knn) {
						updatePointInfo(this.mouseX, this.mouseY)
						this.redraw(this.knn)
					}
					this.throttleTimeout = null
				}, 16) // ~60fps
			}
		})

		// Начало перетаскивания
		this.canvas.addEventListener('mousedown', e => {
			const rect = this.canvas.getBoundingClientRect()
			const x = (e.clientX - rect.left) / this.canvas.width
			const y = (e.clientY - rect.top) / this.canvas.height

			if (this.knn) {
				this.selectedPoint = this.findNearestPoint(x, y)
				if (this.selectedPoint) {
					this.isDragging = true
					this.canvas.style.cursor = 'grabbing'
				}
			}
		})

		// Завершение перетаскивания
		this.canvas.addEventListener('mouseup', () => {
			this.isDragging = false
			this.canvas.style.cursor = 'default'
		})

		// Контекстное меню для удаления точки
		this.canvas.addEventListener('contextmenu', e => {
			e.preventDefault()
			const rect = this.canvas.getBoundingClientRect()
			const x = (e.clientX - rect.left) / this.canvas.width
			const y = (e.clientY - rect.top) / this.canvas.height

			const point = this.findNearestPoint(x, y)
			if (point) {
				this.knn.points = this.knn.points.filter(p => p !== point)
				this.backgroundNeedsUpdate = true
				this.redraw(this.knn)
			}
		})

		this.canvas.addEventListener('mouseleave', () => {
			this.mouseX = null
			this.mouseY = null
			this.isDragging = false
			clearPointInfo()
			if (this.knn) {
				this.redraw(this.knn)
			}
		})
	}

	findNearestPoint(x, y) {
		if (!this.knn || !this.knn.points.length) return null

		const threshold = (this.pointRadius * 2) / this.canvas.width // Порог в относительных координатах
		let nearestPoint = null
		let minDistance = Infinity

		this.knn.points.forEach(point => {
			const distance = Math.sqrt(
				Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
			)

			if (distance < minDistance && distance < threshold) {
				minDistance = distance
				nearestPoint = point
			}
		})

		return nearestPoint
	}

	drawPoint(x, y, className, isHighlighted = false) {
		const isSelected =
			this.selectedPoint &&
			this.selectedPoint.x === x / this.canvas.width &&
			this.selectedPoint.y === y / this.canvas.height

		this.ctx.beginPath()
		this.ctx.arc(x, y, this.pointRadius, 0, 2 * Math.PI)

		// Заливка
		this.ctx.fillStyle = this.colors[className]?.solid || '#999'
		this.ctx.fill()

		// Обводка
		if (isHighlighted || isSelected) {
			this.ctx.lineWidth = 2
			this.ctx.strokeStyle = isSelected ? '#FF9800' : '#000'
			this.ctx.stroke()
		}
	}

	drawBackground(knn) {
		if (!this.backgroundNeedsUpdate) return

		const step = this.gridStep
		const w = this.bgCanvas.width
		const h = this.bgCanvas.height

		this.bgCtx.clearRect(0, 0, w, h)

		for (let x = 0; x < w; x += step) {
			for (let y = 0; y < h; y += step) {
				const prediction = knn.predict(x / w, y / h)
				// Проверяем, есть ли точки с ненулевым значением ядра
				const hasNonZeroKernel = prediction.kernelValues.some(k => k.value > 0)

				if (hasNonZeroKernel) {
					const maxClass = Object.entries(prediction.probabilities).reduce(
						(a, b) => (a[1] > b[1] ? a : b)
					)

					// Используем насыщенность цвета в зависимости от уверенности предсказания
					const confidence = maxClass[1] // вероятность предсказанного класса
					const baseColor = this.colors[maxClass[0]].solid
					const rgb = this._hexToRgb(baseColor)
					const alpha = 0.1 + confidence * 0.3 // от 0.1 до 0.4

					this.bgCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
				} else {
					// Если все значения ядра равны 0, используем серый цвет
					this.bgCtx.fillStyle = 'rgba(200, 200, 200, 0.2)'
				}

				this.bgCtx.fillRect(x, y, step, step)
			}
		}

		// Применяем размытие для сглаживания границ
		this.bgCtx.filter = 'blur(3px)'
		const tempCanvas = document.createElement('canvas')
		tempCanvas.width = w
		tempCanvas.height = h
		const tempCtx = tempCanvas.getContext('2d')
		tempCtx.drawImage(this.bgCanvas, 0, 0)
		this.bgCtx.clearRect(0, 0, w, h)
		this.bgCtx.drawImage(tempCanvas, 0, 0)
		this.bgCtx.filter = 'none'

		this.backgroundNeedsUpdate = false
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	}

	drawArrow(fromX, fromY, toX, toY, color) {
		const headlen = this.arrowHeadLength
		const angle = this.arrowHeadAngle

		// Вычисляем угол линии
		const dx = toX - fromX
		const dy = toY - fromY
		const lineAngle = Math.atan2(dy, dx)

		// Укорачиваем линию на радиус точки
		const pointRadius = this.pointRadius
		const lineLength = Math.sqrt(dx * dx + dy * dy)
		const shortenedX = fromX + (dx * pointRadius) / lineLength
		const shortenedY = fromY + (dy * pointRadius) / lineLength

		// Рисуем линию
		this.ctx.beginPath()
		this.ctx.moveTo(shortenedX, shortenedY)
		this.ctx.lineTo(toX, toY)

		// Рисуем наконечник стрелки
		this.ctx.moveTo(toX, toY)
		this.ctx.lineTo(
			toX - headlen * Math.cos(lineAngle - angle),
			toY - headlen * Math.sin(lineAngle - angle)
		)
		this.ctx.moveTo(toX, toY)
		this.ctx.lineTo(
			toX - headlen * Math.cos(lineAngle + angle),
			toY - headlen * Math.sin(lineAngle + angle)
		)

		// Устанавливаем стиль
		this.ctx.strokeStyle = color
		this.ctx.lineWidth = 2
		this.ctx.stroke()
	}

	redraw(knn) {
		this.knn = knn
		this.clear()

		// Отрисовываем фон с предсказаниями, если есть точки
		if (knn && knn.points.length > 0) {
			this.drawBackground(knn)
			this.ctx.drawImage(this.bgCanvas, 0, 0)
		}

		// Отрисовываем точки
		if (knn) {
			knn.points.forEach(point => {
				this.drawPoint(
					point.x * this.canvas.width,
					point.y * this.canvas.height,
					point.className
				)
			})
		}

		// Отрисовываем текущую позицию мыши
		if (this.mouseX !== null && this.mouseY !== null) {
			this.drawPoint(
				this.mouseX * this.canvas.width,
				this.mouseY * this.canvas.height,
				document.getElementById('class-select').value,
				true
			)
		}

		// Добавляем отрисовку стрелок к ближайшим соседям
		if (
			this.mouseX !== null &&
			this.mouseY !== null &&
			knn &&
			knn.points.length > 0
		) {
			const prediction = knn.predict(this.mouseX, this.mouseY)
			const mouseScreenX = this.mouseX * this.canvas.width
			const mouseScreenY = this.mouseY * this.canvas.height

			// Отрисовываем стрелки к k ближайшим соседям
			prediction.distances.forEach((d, index) => {
				const point = knn.points.find(
					p =>
						p.x === d.point.x &&
						p.y === d.point.y &&
						p.className === d.point.className
				)
				if (point) {
					const color = this.colors[point.className].solid
					// Делаем стрелки более прозрачными для более дальних соседей
					const alpha = 1 - (index / prediction.distances.length) * 0.7
					this.drawArrow(
						mouseScreenX,
						mouseScreenY,
						point.x * this.canvas.width,
						point.y * this.canvas.height,
						color.replace(')', `, ${alpha})`)
					)
				}
			})
		}
	}

	// Вспомогательная функция для конвертации HEX в RGB
	_hexToRgb(hex) {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
			  }
			: null
	}
}

// Экспортируем класс
window.CanvasManager = CanvasManager
