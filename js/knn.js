class KNN {
    constructor() {
        this.points = [];
        this.k = 3;
        this.kernel = 'uniform';
        this.distance = 'euclidean';
        this.kernelScale = 1;
        this.window = 'fixed';
    }

    setK(k) {
        this.k = k;
    }

    setKernel(kernel) {
        this.kernel = kernel;
    }

    setDistance(distance) {
        this.distance = distance;
    }

    setKernelScale(scale) {
        this.kernelScale = scale;
    }

    setWindow(window) {
        this.window = window;
    }

    calculateDistance(point1, point2) {
        switch(this.distance) {
            case 'euclidean':
                return Math.sqrt(
                    Math.pow(point1.x - point2.x, 2) + 
                    Math.pow(point1.y - point2.y, 2)
                );
            case 'manhattan':
                return Math.abs(point1.x - point2.x) + 
                       Math.abs(point1.y - point2.y);
            case 'chebyshev':
                return Math.max(
                    Math.abs(point1.x - point2.x),
                    Math.abs(point1.y - point2.y)
                );
        }
    }

	kernelFunction(r) {
		switch (this.kernel) {
			case 'uniform':
				return r <= 1 ? 1 : 0
			case 'gaussian':
				return Math.exp(-(Math.pow(r, 2) / 2))
			case 'epanechnikov':
				return r <= 1 ? 0.75 * (1 - Math.pow(r, 2)) : 0
			default:
				return 1
		}
	}

	calculateLocalDensity(distance) {
		const pilotBandwidth = this.kernelScale
		let density = 0

		this.points.forEach(p => {
			const d = this.calculateDistance(
				{ x: p.x, y: p.y },
				{ x: this.currentPoint.x, y: this.currentPoint.y }
			)
			density += Math.exp(-(Math.pow(d / pilotBandwidth, 2) / 2))
		})

		return density / this.points.length
	}

    addPoint(x, y, className) {
        this.points.push({ x, y, className });
    }

    predict(x, y) {
        if (this.points.length === 0) {
            return {
                probabilities: {},
                distances: [],
                kernelValues: []
            };
        }

		this.currentPoint = { x, y }
		const point = { x, y }
		const distances = this.points.map(p => ({
			point: p,
			distance: this.calculateDistance(point, p),
			className: p.className,
		}))

		distances.sort((a, b) => a.distance - b.distance)
		const k = Math.min(this.k, distances.length)
		const neighbors = distances.slice(0, k)

		const classProbs = {}
		let totalWeight = 0

		if (this.window === 'fixed') {
			neighbors.forEach(neighbor => {
				const kernelValue = this.kernelFunction(
					neighbor.distance / this.kernelScale
				)
				totalWeight += kernelValue

				if (!classProbs[neighbor.className]) {
					classProbs[neighbor.className] = 0
				}
				classProbs[neighbor.className] += kernelValue
			})
		} else {
			const kPlusOneDistance = distances[k]
				? distances[k].distance
				: distances[k - 1].distance

			neighbors.forEach(neighbor => {
				const kernelValue = this.kernelFunction(
					neighbor.distance / kPlusOneDistance
				)
				totalWeight += kernelValue

				if (!classProbs[neighbor.className]) {
					classProbs[neighbor.className] = 0
				}
				classProbs[neighbor.className] += kernelValue
			})
		}

		Object.keys(classProbs).forEach(className => {
			classProbs[className] /= totalWeight
		})

		return {
			probabilities: classProbs,
			distances: neighbors,
			kernelValues: neighbors.map(n => ({
				value: this.kernelFunction(
					this.window === 'fixed'
						? n.distance / this.kernelScale
						: n.distance /
								(distances[k]
									? distances[k].distance
									: distances[k - 1].distance)
				),
				className: n.point.className,
				point: n.point,
			})),
		}
	}
}
