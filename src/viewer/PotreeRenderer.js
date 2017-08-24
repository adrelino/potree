class PotreeRenderer {
	constructor (viewer) {
		this.viewer = viewer;
	};

	render () {
		{ // resize
			let width = this.viewer.scaleFactor * this.viewer.renderArea.clientWidth;
			let height = this.viewer.scaleFactor * this.viewer.renderArea.clientHeight;
			let aspect = width / height;

			this.viewer.scene.camera.aspect = aspect;
			this.viewer.scene.camera.updateProjectionMatrix();

			this.viewer.renderer.setSize(width, height);
		}

		// render skybox
		if (this.viewer.background === 'skybox') {
			this.viewer.renderer.clear(true, true, false);
			this.viewer.skybox.camera.rotation.copy(this.viewer.scene.camera.rotation);
			this.viewer.skybox.camera.fov = this.viewer.scene.camera.fov;
			this.viewer.skybox.camera.aspect = this.viewer.scene.camera.aspect;
			this.viewer.skybox.camera.updateProjectionMatrix();
			this.viewer.renderer.render(this.viewer.skybox.scene, this.viewer.skybox.camera);
		} else if (this.viewer.background === 'gradient') {
			// this.viewer.renderer.clear(true, true, false);
			this.viewer.renderer.render(this.viewer.scene.sceneBG, this.viewer.scene.cameraBG);
		} else if (this.viewer.background === 'black') {
			this.viewer.renderer.setClearColor(0x000000, 1);
			this.viewer.renderer.clear(true, true, false);
		} else if (this.viewer.background === 'white') {
			this.viewer.renderer.setClearColor(0xFFFFFF, 1);
			this.viewer.renderer.clear(true, true, false);
		}

		for (let pointcloud of this.viewer.scene.pointclouds) {
			pointcloud.material.useEDL = false;
		}

		// var queryPC = Potree.startQuery("PointCloud", this.viewer.renderer.getContext());
		this.viewer.renderer.render(this.viewer.scene.scenePointCloud, this.viewer.scene.camera);
		// Potree.endQuery(queryPC, this.viewer.renderer.getContext());

		// render scene
		this.viewer.renderer.render(this.viewer.scene.scene, this.viewer.scene.camera);

		this.viewer.volumeTool.update();
		this.viewer.renderer.render(this.viewer.volumeTool.sceneVolume, this.viewer.scene.camera);
		this.viewer.renderer.render(this.viewer.controls.sceneControls, this.viewer.scene.camera);

		this.viewer.renderer.clearDepth();

		this.viewer.measuringTool.update();
		this.viewer.profileTool.update();
		this.viewer.transformationTool.update();

		this.viewer.renderer.render(this.viewer.measuringTool.sceneMeasurement, this.viewer.scene.camera);
		this.viewer.renderer.render(this.viewer.profileTool.sceneProfile, this.viewer.scene.camera);
		this.viewer.renderer.render(this.viewer.transformationTool.sceneTransform, this.viewer.scene.camera);

		// Potree.endQuery(queryAll, this.viewer.renderer.getContext());

		// Potree.resolveQueries(this.viewer.renderer.getContext());
	};
};
