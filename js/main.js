let knn, canvasManager
let datasetSelect,
	loadDatasetBtn,
	clearBtn,
	addPointBtn,
	classSelect,
	kValueInput,
	kernelSelect,
	kernelScaleInput,
	distanceSelect,
	windowSelect

let shouldUpdateInfo = true // Флаг для контроля обновления информации

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
	// Инициализация объектов
	knn = new KNN()
	canvasManager = new CanvasManager()

	// Получение элементов DOM
	datasetSelect = document.getElementById('dataset-select')
	loadDatasetBtn = document.getElementById('load-dataset')
	clearBtn = document.getElementById('clear')
	addPointBtn = document.getElementById('add-point')
	classSelect = document.getElementById('class-select')
	kValueInput = document.getElementById('k-value')
	kernelSelect = document.getElementById('kernel')
	kernelScaleInput = document.getElementById('kernel-scale')
	distanceSelect = document.getElementById('distance')
	windowSelect = document.getElementById('window')

	// Обработчик загрузки предопределенных наборов
	loadDatasetBtn.addEventListener('click', () => {
		const selectedDataset = datasetSelect.value
		if (!selectedDataset) return

		// Очищаем текущие точки
		knn.points = []

		// Загружаем выбранный набор данных
		let points
		switch (selectedDataset) {
			case 'circles':
				points = DatasetGenerator.generateCircles()
				break
			case 'spiral':
				points = DatasetGenerator.generateSpiral()
				break
			case 'moons':
				points = DatasetGenerator.generateMoons()
				break
			case 'blobs':
				points = DatasetGenerator.generateBlobs()
				break
		}

		// Добавляем точки в knn
		points.forEach(point => {
			knn.addPoint(point.x, point.y, point.className)
		})

		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})

	// Обработчик добавления точек по клику на канвас
	canvasManager.canvas.addEventListener('click', e => {
		const rect = canvasManager.canvas.getBoundingClientRect()
		const x = (e.clientX - rect.left) / canvasManager.canvas.width
		const y = (e.clientY - rect.top) / canvasManager.canvas.height

		knn.addPoint(x, y, classSelect.value)
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})

	// Обработчик кнопки для добавления случайной точки
	addPointBtn.addEventListener('click', () => {
		// Генерируем случайные координаты от 0.1 до 0.9 чтобы точки не были слишком близко к краям
		const x = 0.1 + Math.random() * 0.8
		const y = 0.1 + Math.random() * 0.8

		knn.addPoint(x, y, classSelect.value)
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})

	// Обработчик очистки
	clearBtn.addEventListener('click', () => {
		knn.points = []
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
		clearPointInfo()
	})

	// Обработчики изменения параметров
	kValueInput.addEventListener('change', () => {
		knn.setK(parseInt(kValueInput.value))
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})

	kernelSelect.addEventListener('change', () => {
		knn.setKernel(kernelSelect.value)
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})

	distanceSelect.addEventListener('change', () => {
		knn.setDistance(distanceSelect.value)
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})

	// Обработчик изменения масштаба ядра
	kernelScaleInput.addEventListener('change', () => {
		knn.setKernelScale(parseFloat(kernelScaleInput.value))
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})

	// Добавляем обработчик
	windowSelect.addEventListener('change', () => {
		knn.setWindow(windowSelect.value)
		canvasManager.backgroundNeedsUpdate = true
		canvasManager.redraw(knn)
	})
})

// Функции для обновления информационной панели
function updatePointInfo(x, y) {
	if (!shouldUpdateInfo) return // Проверяем флаг перед обновлением

	const prediction = knn.predict(x, y)

	// Обновляем расстояния
	const distancesDiv = document.querySelector('#distances .info-data')
	distancesDiv.innerHTML = prediction.distances
		.map(
			d => `
			<div class="info-row">
				<span class="info-label">
					<span class="class-dot" style="background: ${getClassColor(
						d.className
					)}"></span>
					Класс ${d.className}:
				</span>
				<span class="info-value" style="color: ${getClassColor(d.className)}">
					${d.distance.toFixed(4)}
				</span>
			</div>
		`
		)
		.join('')

	// Обновляем значения ядра
	const kernelDiv = document.querySelector('#kernel-values .info-data')
	kernelDiv.innerHTML = prediction.kernelValues
		.map(
			k => `
            <div class="info-row">
                <span class="info-label">
                    <span class="class-dot" style="background: ${getClassColor(
											k.className
										)}"></span>
                    Класс ${k.className}:
                </span>
                <span class="info-value" style="color: ${getClassColor(
									k.className
								)}">
                    ${k.value.toFixed(4)}
                </span>
                <div class="kernel-bar" style="width: ${
									k.value * 100
								}%; background: ${getClassColor(k.className)}"></div>
            </div>
        `
		)
		.join('')

	// Обновляем вероятности
	const probDiv = document.querySelector('#probabilities .info-data')
	probDiv.innerHTML = Object.entries(prediction.probabilities)
		.map(
			([className, prob]) => `
            <div class="info-row">
                <span class="info-label">
                    <span class="class-dot" style="background: ${getClassColor(
											className
										)}"></span>
                    Класс ${className}:
                </span>
                <span class="info-value" style="color: ${getClassColor(
									className
								)}">
                    ${(prob * 100).toFixed(1)}%
                </span>
                <div class="probability-bar" style="width: ${
									prob * 100
								}%; background: ${getClassColor(className)}"></div>
            </div>
        `
		)
		.join('')
}

function clearPointInfo() {
	document.querySelector('#distances .info-data').innerHTML = ''
	document.querySelector('#kernel-values .info-data').innerHTML = ''
	document.querySelector('#probabilities .info-data').innerHTML = ''
}

// Добавляем вспомогательную функцию для получения цвета класса
function getClassColor(className) {
	const colors = {
		1: '#2196F3', // синий
		2: '#F44336', // красный
		3: '#4CAF50', // зеленый
	}
	return colors[className] || '#999'
}

document.addEventListener('keydown', function (event) {
	if (event.key === '6') {
		shouldUpdateInfo = !shouldUpdateInfo // Переключаем флаг при нажатии на 6
	}
})
