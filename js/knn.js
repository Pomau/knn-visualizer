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

    kernelFunction(distance) {
        const h = this.window === 'adaptive' ? 
            (this.currentKDistance || this.kernelScale) : 
            this.kernelScale;
        
        const scaledDistance = distance / h;

        if (this.window === 'fixed' || this.window === 'adaptive') {
            switch(this.kernel) {
                case 'uniform':
                    return scaledDistance <= 1 ? 1 : 0;
                case 'gaussian':
                    return Math.exp(-(Math.pow(scaledDistance, 2) / 2));
                case 'epanechnikov':
                    return scaledDistance <= 1 ? 0.75 * (1 - Math.pow(scaledDistance, 2)) : 0;
                default:
                    return 1;
            }
        } else if (this.window === 'variable') {
            const density = this.calculateLocalDensity(distance);
            const adjustedScale = this.kernelScale / Math.sqrt(density);
            const adjustedDistance = distance / adjustedScale;
            
            switch(this.kernel) {
                case 'uniform':
                    return adjustedDistance <= 1 ? 1 : 0;
                case 'gaussian':
                    return Math.exp(-(Math.pow(adjustedDistance, 2) / 2));
                case 'epanechnikov':
                    return adjustedDistance <= 1 ? 0.75 * (1 - Math.pow(adjustedDistance, 2)) : 0;
                default:
                    return 1;
            }
        }
    }

    calculateLocalDensity(distance) {
        const pilotBandwidth = this.kernelScale;
        let density = 0;
        
        this.points.forEach(p => {
            const d = this.calculateDistance({ x: p.x, y: p.y }, { x: this.currentPoint.x, y: this.currentPoint.y });
            density += Math.exp(-(Math.pow(d / pilotBandwidth, 2) / 2));
        });
        
        return density / this.points.length;
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

        this.currentPoint = { x, y };
        const point = { x, y };
        const distances = this.points.map(p => ({
            point: p,
            distance: this.calculateDistance(point, p),
            className: p.className
        }));

        distances.sort((a, b) => a.distance - b.distance);
        const k = Math.min(this.k, distances.length);
        const neighbors = distances.slice(0, k);

        if (this.window === 'adaptive') {
            this.currentKDistance = neighbors[neighbors.length - 1].distance;
        }

        const classProbs = {};
        let totalWeight = 0;

        neighbors.forEach(neighbor => {
            const weight = this.kernelFunction(neighbor.distance);
            totalWeight += weight;
            
            if (!classProbs[neighbor.className]) {
                classProbs[neighbor.className] = 0;
            }
            classProbs[neighbor.className] += weight;
        });

        Object.keys(classProbs).forEach(className => {
            classProbs[className] /= totalWeight;
        });

        return {
            probabilities: classProbs,
            distances: neighbors,
            kernelValues: neighbors.map(n => ({
                value: this.kernelFunction(n.distance),
                className: n.point.className,
                point: n.point
            }))
        };
    }
} 