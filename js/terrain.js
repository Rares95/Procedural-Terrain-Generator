class Terrain
{
    constructor(length, width, resolution, material, updateInterval)
    {
        this.length = length;
        this.width = width;
        this.currentInterval = 1 / config.updateInterval;
        this.offsetX = 0;
        this.offsetZ = 0;
        this.material = material;
        this.resolution = Math.max(Math.max(1 / this.width, 1 / this.length), resolution);
        this.seed = config.seed;
        this.simplex = new SimplexNoise(this.seed);
        this.geometry = new THREE.PlaneBufferGeometry(
            length,
            width,
            length * this.resolution - 1,
            width * this.resolution - 1
        );
        let rotation = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        this.geometry.applyMatrix(rotation);
        this.array = this.geometry.attributes.position.array;
        this.mesh = null;
    }

    build()
    {
        console.log("Building terrain!");
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeBoundingSphere();
        this.geometry.computeVertexNormals();

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = 0;
        this.mesh.position.z = 0;
        return this.mesh;
    }

    rebuild(resolution)
    {
        console.log("Rebuilding terrain!");
        app.scene.remove(this.mesh);
        this.resolution = Math.max(Math.max(1 / this.width, 1 / this.length), resolution);
        this.geometry.dispose();
        this.geometry = new THREE.PlaneBufferGeometry(
            this.length,
            this.width,
            this.length * this.resolution - 1,
            this.width * this.resolution - 1
        );
        let rotation = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        this.geometry.applyMatrix(rotation);
        this.array = this.geometry.attributes.position.array;
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeBoundingSphere();
        this.geometry.computeVertexNormals();

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = 0;
        this.mesh.position.z = 0;
        return this.mesh;
    }

    randomTerrainHeight(deltaTime, minHeight, maxHeight)
    {
        this.currentInterval += deltaTime;
        if (this.currentInterval > getUpdateInterval())
        {
            this.currentInterval = 0;
        }
        else
        {
            return;
        }

        let position = this.geometry.attributes.position;
        for (let i = 0; i < this.array.length / 3; ++i)
        {
            let height = (Math.random()) * (maxHeight - minHeight) + minHeight;
            position.setY(i, height);
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeBoundingSphere();
        this.geometry.computeVertexNormals();
    }

    rebuildSimplexCheck()
    {
        if (this.seed != config.seed)
        {
            this.seed = config.seed;
            this.simplex = new SimplexNoise(this.seed);
        }
    }

    simplexTerrainHeight(deltaTime)
    {
        this.rebuildSimplexCheck();
        this.currentInterval += deltaTime;
        if (this.currentInterval > getUpdateInterval())
        {
            this.currentInterval = 0;
        }
        else
        {
            return;
        }

        this.offsetX += config.movementSpeed * app.moveX * deltaTime * this.length * getUpdateInterval();
        this.offsetZ += config.movementSpeed * app.moveZ * deltaTime * this.width * getUpdateInterval();

        let position = this.geometry.attributes.position;
        for (let i = 0; i < position.count; ++i)
        {
            let posX = position.getX(i) + this.offsetX;
            let posZ = position.getZ(i) + this.offsetZ;
            let height = 0;
            for (let i = 1; i <= config.noiseLevels; ++i)
            {
                let power = Math.pow(0.1 * i, i);
                height += this.generateNoise(posX * power, posZ * power);
            }

            height = this.applyModifiers(height);

            height *= config.terrainScale;
            position.setY(i, height);
        }
        position.needsUpdate = true;
        this.geometry.computeBoundingSphere();
        this.geometry.computeVertexNormals();
    }

    generateNoise(posX, posZ)
    {
        return this.simplex.noise2D(posX, posZ) / 2;
    }

    applyModifiers(height)
    {
        if (config.easeIn)
        {
            height = this.easeIn(height);
        }

        if (config.easeInOutQuad)
        {
            height = this.easeInOutQuad(height);
        }

        if (config.easeInOutCubic)
        {
            height = this.easeInOutCubic(height);
        }

        if (config.logaritmic)
        {
            height -= (height > 1) ? (Math.log10(height)) : height;
        }

        if (config.isqrt)
        {
            height -= (height > 0) ? (Math.sqrt(height)) : 0;
        }

        if (config.sqrt)
        {
            height += (height > 0) ? (Math.sqrt(height)) : 0;
        }

        if (config.floor)
        {
            height = Math.floor(height);
        }

        if (config.longerBeaches)
        {
            height = this.longerBeaches(height);
        }

        if (config.dampenUnderwaterHeight)
        {
            height = this.dampenUnderwaterHeight(height);
        }

        if (config.moreWater)
        {
            height = this.moreWater(height);
        }
        return height;
    }

    dampenUnderwaterHeight(t)
    {
        let dampenFactor = 8;
        return t < 0 ? (t /= dampenFactor) : t;
    }

    longerBeaches(t)
    {
        let convertBeachInterval = 0.1;
        if (-convertBeachInterval < t && t < 0.001) t = 0.001;
        else if (-convertBeachInterval * 2 < t && t <= -convertBeachInterval) t /= 3;
        return t;
    }

    moreWater(t)
    {
        let convertBeachInterval = 0.05;
        if (t < convertBeachInterval) t -= convertBeachInterval;
        return t;
    }

    easeIn(t)
    {
        return t < .5 ? 2 * t * t - 0.1 : -1 + (4 - 2 * t) * t;
    }

    easeInOutQuad(t)
    {
        return t < .5 ? 2 * t * -t : -1 + 2 * (2 - t) * t;
    }

    easeInOutCubic(t)
    {
        return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
}
