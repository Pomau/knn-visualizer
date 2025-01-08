class DatasetGenerator {
    static generateCircles() {
        const points = [];
        const numPoints = 100;
        const centerX = 0.5;
        const centerY = 0.5;
        
        // Внутренний круг
        for (let i = 0; i < numPoints / 2; i++) {
            const angle = (2 * Math.PI * i) / (numPoints / 2);
            const radius = 0.15 + Math.random() * 0.05;
            points.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                className: '1'
            });
        }
        
        // Внешний круг
        for (let i = 0; i < numPoints / 2; i++) {
            const angle = (2 * Math.PI * i) / (numPoints / 2);
            const radius = 0.35 + Math.random() * 0.05;
            points.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                className: '2'
            });
        }
        
        return points;
    }

    static generateSpiral() {
        const points = [];
        const numPoints = 100;
        const centerX = 0.5;
        const centerY = 0.5;
        
        // Первая спираль
        for (let i = 0; i < numPoints / 2; i++) {
            const t = (4 * Math.PI * i) / (numPoints / 2);
            const radius = 0.1 + (0.3 * t) / (4 * Math.PI);
            points.push({
                x: centerX + radius * Math.cos(t) + (Math.random() - 0.5) * 0.02,
                y: centerY + radius * Math.sin(t) + (Math.random() - 0.5) * 0.02,
                className: '1'
            });
        }
        
        // Вторая спираль
        for (let i = 0; i < numPoints / 2; i++) {
            const t = (4 * Math.PI * i) / (numPoints / 2);
            const radius = 0.1 + (0.3 * t) / (4 * Math.PI);
            points.push({
                x: centerX + radius * Math.cos(t + Math.PI) + (Math.random() - 0.5) * 0.02,
                y: centerY + radius * Math.sin(t + Math.PI) + (Math.random() - 0.5) * 0.02,
                className: '2'
            });
        }
        
        return points;
    }

    static generateMoons() {
        const points = [];
        const numPoints = 100;
        
        // Первый полумесяц
        for (let i = 0; i < numPoints / 2; i++) {
            const angle = (Math.PI * i) / (numPoints / 2);
            const radius = 0.25;
            points.push({
                x: 0.4 + radius * Math.cos(angle) + (Math.random() - 0.5) * 0.02,
                y: 0.5 + radius * Math.sin(angle) + (Math.random() - 0.5) * 0.02,
                className: '1'
            });
        }
        
        // Второй полумесяц
        for (let i = 0; i < numPoints / 2; i++) {
            const angle = Math.PI + (Math.PI * i) / (numPoints / 2);
            const radius = 0.25;
            points.push({
                x: 0.6 + radius * Math.cos(angle) + (Math.random() - 0.5) * 0.02,
                y: 0.5 + radius * Math.sin(angle) + (Math.random() - 0.5) * 0.02,
                className: '2'
            });
        }
        
        return points;
    }

    static generateBlobs() {
        const points = [];
        const numClusters = 3;
        const pointsPerCluster = 33;
        
        for (let cluster = 0; cluster < numClusters; cluster++) {
            const centerX = 0.25 + Math.random() * 0.5;
            const centerY = 0.25 + Math.random() * 0.5;
            
            for (let i = 0; i < pointsPerCluster; i++) {
                // Используем Box-Muller transform для нормального распределения
                const u1 = Math.random();
                const u2 = Math.random();
                const radius = 0.08;
                const z1 = radius * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                const z2 = radius * Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
                
                points.push({
                    x: centerX + z1,
                    y: centerY + z2,
                    className: (cluster + 1).toString()
                });
            }
        }
        
        return points;
    }
} 