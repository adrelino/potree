
Potree.Action = class Action extends THREE.EventDispatcher{

	constructor(args = {}){
		super();
		
		this.icon = args.icon || "";
		this.tooltip = args.tooltip;
		
		if(args.onclick !== undefined){
			this.onclick = args.onclick;
		}
		
	}
	
	onclick(event){
		
	}
	
	setIcon(newIcon){
		let oldIcon = this.icon;
		
		if(newIcon === oldIcon){
			return;
		}
		
		this.icon = newIcon;
		
		this.dispatchEvent({
			type: "icon_changed",
			action: this,
			icon: newIcon,
			oldIcon: oldIcon
		});
	}

};

Potree.Actions = {};

Potree.Actions.ToggleAnnotationVisibility = class ToggleAnnotationVisibility extends Potree.Action{

	constructor(args = {}){
		super(args);
		
		this.icon = Potree.resourcePath + "/icons/eye.svg";
		this.showIn = "sidebar";
		this.tooltip = "toggle visibility";
	}
	
	onclick(event){
		let annotation = event.annotation;
		
		annotation.visible = !annotation.visible;
		
		if(annotation.visible){
			this.setIcon(Potree.resourcePath + "/icons/eye.svg");
		}else{
			this.setIcon(Potree.resourcePath + "/icons/eye_crossed.svg");
		}
	}
}

