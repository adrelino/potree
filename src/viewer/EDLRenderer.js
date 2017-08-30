class EDLRenderer {
	constructor (viewer) {
		this.viewer = viewer;

		this.edlMaterial = null;
		this.attributeMaterials = [];

		this.rtColor = null;
		this.gl = viewer.renderer.context;

		this.initEDL = this.initEDL.bind(this);
		this.resize = this.resize.bind(this);
		this.render = this.render.bind(this);
	}

	initEDL () {
		if (this.edlMaterial != null) {
			return;
		}

		// var depthTextureExt = gl.getExtension("WEBGL_depth_texture");

		this.edlMaterial = new Potree.EyeDomeLightingMaterial();

		this.rtColor = new THREE.WebGLRenderTarget(1024, 1024, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType
		});
		this.rtColor.depthTexture = new THREE.DepthTexture();
		this.rtColor.depthTexture.type = THREE.UnsignedIntType;
	};

	resize () {
		let width = this.viewer.scaleFactor * this.viewer.renderArea.clientWidth;
		let height = this.viewer.scaleFactor * this.viewer.renderArea.clientHeight;
		let aspect = width / height;

		let needsResize = (this.rtColor.width !== width || this.rtColor.height !== height);

		// disposal will be unnecessary once this fix made it into three.js master:
		// https://github.com/mrdoob/three.js/pull/6355
		if (needsResize) {
			this.rtColor.dispose();
		}

		this.viewer.scene.camera.aspect = aspect;
		this.viewer.scene.camera.updateProjectionMatrix();

		this.viewer.renderer.setSize(width, height);
		this.rtColor.setSize(width, height);
	}

	render () {
		this.initEDL();
		const viewer = this.viewer;

		this.resize();

		if (viewer.background === 'skybox') {
			viewer.renderer.setClearColor(0x000000, 0);
			viewer.renderer.clear();
			viewer.skybox.camera.rotation.copy(viewer.scene.camera.rotation);
			viewer.skybox.camera.fov = viewer.scene.camera.fov;
			viewer.skybox.camera.aspect = viewer.scene.camera.aspect;
			viewer.skybox.camera.updateProjectionMatrix();
			viewer.renderer.render(viewer.skybox.scene, viewer.skybox.camera);
		} else if (viewer.background === 'gradient') {
			viewer.renderer.setClearColor(0x000000, 0);
			viewer.renderer.clear();
			viewer.renderer.render(viewer.scene.sceneBG, viewer.scene.cameraBG);
		} else if (viewer.background === 'black') {
			viewer.renderer.setClearColor(0x000000, 0);
			viewer.renderer.clear();
		} else if (viewer.background === 'white') {
			viewer.renderer.setClearColor(0xFFFFFF, 0);
			viewer.renderer.clear();
		}

		viewer.measuringTool.update();
		viewer.profileTool.update();
		viewer.transformationTool.update();
		viewer.volumeTool.update();

		viewer.renderer.render(viewer.scene.scene, viewer.scene.camera);

		viewer.renderer.clearTarget(this.rtColor, true, true, true);

		let width = viewer.renderArea.clientWidth;
		let height = viewer.renderArea.clientHeight;

		// COLOR & DEPTH PASS
		for (let pointcloud of viewer.scene.pointclouds) {
			let octreeSize = pointcloud.pcoGeometry.boundingBox.getSize().x;

			let material = pointcloud.material;
			material.weighted = false;
			material.useLogarithmicDepthBuffer = false;
			material.useEDL = true;

			material.screenWidth = width;
			material.screenHeight = height;
			material.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
			material.uniforms.octreeSize.value = octreeSize;
			material.fov = viewer.scene.camera.fov * (Math.PI / 180);
			material.spacing = pointcloud.pcoGeometry.spacing * Math.max(pointcloud.scale.x, pointcloud.scale.y, pointcloud.scale.z);
			material.near = viewer.scene.camera.near;
			material.far = viewer.scene.camera.far;
		}

		viewer.renderer.render(viewer.scene.scenePointCloud, viewer.scene.camera, this.rtColor);
		viewer.renderer.render(viewer.scene.scene, viewer.scene.camera, this.rtColor);

		// bit of a hack here. The EDL pass will mess up the text of the volume tool
		// so volume tool is rendered again afterwards
		// viewer.volumeTool.render(this.rtColor);

		viewer.renderer.render(viewer.volumeTool.sceneVolume, viewer.scene.camera, this.rtColor);

		{ // EDL OCCLUSION PASS
			this.edlMaterial.uniforms.screenWidth.value = width;
			this.edlMaterial.uniforms.screenHeight.value = height;
			this.edlMaterial.uniforms.colorMap.value = this.rtColor.texture;
			this.edlMaterial.uniforms.edlStrength.value = viewer.edlStrength;
			this.edlMaterial.uniforms.radius.value = viewer.edlRadius;
			this.edlMaterial.uniforms.opacity.value = 1;
			this.edlMaterial.depthTest = true;
			this.edlMaterial.depthWrite = true;
			this.edlMaterial.transparent = true;

			Potree.utils.screenPass.render(viewer.renderer, this.edlMaterial);
		}

		viewer.renderer.clearDepth();
		viewer.renderer.render(viewer.controls.sceneControls, viewer.scene.camera);

		viewer.renderer.render(viewer.measuringTool.sceneMeasurement, viewer.scene.camera);
		viewer.renderer.render(viewer.profileTool.sceneProfile, viewer.scene.camera);
		viewer.renderer.render(viewer.transformationTool.sceneTransform, viewer.scene.camera);
	}
};

module.exports = EDLRenderer;
