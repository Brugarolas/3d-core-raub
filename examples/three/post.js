const initCore = require('../..');
const {
	THREE,
	window,
	document,
	requestAnimationFrame,
	Image,
} = initCore();

const getJs = p => require(`three/examples/js/${p}`);

getJs('postprocessing/EffectComposer');
getJs('postprocessing/RenderPass');
getJs('postprocessing/ShaderPass');
getJs('postprocessing/BloomPass');
getJs('postprocessing/FilmPass');
getJs('postprocessing/DotScreenPass');
getJs('postprocessing/MaskPass');
getJs('postprocessing/TexturePass');
getJs('shaders/BleachBypassShader');
getJs('shaders/DotScreenShader');
getJs('shaders/FilmShader');
getJs('shaders/CopyShader');
getJs('shaders/ConvolutionShader');
getJs('shaders/ColorifyShader');
getJs('shaders/HorizontalBlurShader');
getJs('shaders/VerticalBlurShader');
getJs('shaders/SepiaShader');
getJs('shaders/VignetteShader');
getJs('loaders/GLTFLoader');

const {
	EffectComposer,
	RenderPass,
	ShaderPass,
	BloomPass,
	FilmPass,
	DotScreenPass,
	MaskPass,
	ClearMaskPass,
	TexturePass,
	BleachBypassShader,
	ColorifyShader,
	HorizontalBlurShader,
	VerticalBlurShader,
	SepiaShader,
	VignetteShader,
	GLTFLoader,
} = THREE;

const icon = new Image();
icon.src = __dirname + '/textures/three.png';
icon.on('load', () => document.icon = icon);
document.title = 'Postprocessing';


var container;
var composerScene, composer1, composer2, composer3, composer4;
var cameraOrtho, cameraPerspective, sceneModel, sceneBG, renderer, mesh, directionalLight;
var width = window.innerWidth || 2;
var height = window.innerHeight || 2;
var halfWidth = width / 2;
var halfHeight = height / 2;
var quadBG, quadMask, renderScene;
var delta = 0.01;
init();
animate();
function init() {
	container = document.getElementById( 'container' );
	//
	cameraOrtho = new THREE.OrthographicCamera(
		-halfWidth,
		halfWidth,
		halfHeight,
		-halfHeight,
		-10000,
		10000
	);
	cameraOrtho.position.z = 100;
	cameraPerspective = new THREE.PerspectiveCamera( 50, width / height, 1, 10000 );
	cameraPerspective.position.z = 900;
	//
	sceneModel = new THREE.Scene();
	sceneBG = new THREE.Scene();
	//
	directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( 0, -0.1, 1 ).normalize();
	sceneModel.add( directionalLight );
	var loader = new GLTFLoader();
	loader.load( __dirname + "/models/LeePerrySmith.glb", function ( gltf ) {
		createMesh( gltf.scene.children[ 0 ].geometry, sceneModel, 100 );
	} );
	//
	var materialColor = new THREE.MeshBasicMaterial( {
		map: new THREE.TextureLoader().load( __dirname + "/textures/pz.jpg" ),
		depthTest: false
	} );
	quadBG = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ), materialColor );
	quadBG.position.z = -500;
	quadBG.scale.set( width, height, 1 );
	sceneBG.add( quadBG );
	//
	var sceneMask = new THREE.Scene();
	quadMask = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 1, 1 ),
		new THREE.MeshBasicMaterial( { color: 0xffaa00 } )
	);
	quadMask.position.z = -300;
	quadMask.scale.set( width / 2, height / 2, 1 );
	sceneMask.add( quadMask );
	//
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( width, height );
	renderer.autoClear = false;
	//
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	//
	container.appendChild( renderer.domElement );
	//
	//
	var shaderBleach = BleachBypassShader;
	var shaderSepia = SepiaShader;
	var shaderVignette = VignetteShader;
	// var shaderCopy = CopyShader;
	var effectBleach = new ShaderPass( shaderBleach );
	var effectSepia = new ShaderPass( shaderSepia );
	var effectVignette = new ShaderPass( shaderVignette );
	// var effectCopy = new ShaderPass( shaderCopy );
	effectBleach.uniforms[ "opacity" ].value = 0.95;
	effectSepia.uniforms[ "amount" ].value = 0.9;
	effectVignette.uniforms[ "offset" ].value = 0.95;
	effectVignette.uniforms[ "darkness" ].value = 1.6;
	var effectBloom = new BloomPass( 0.5 );
	var effectFilm = new FilmPass( 0.35, 0.025, 648, false );
	var effectFilmBW = new FilmPass( 0.35, 0.5, 2048, true );
	var effectDotScreen = new DotScreenPass( new THREE.Vector2( 0, 0 ), 0.5, 0.8 );
	var effectHBlur = new ShaderPass( HorizontalBlurShader );
	var effectVBlur = new ShaderPass( VerticalBlurShader );
	effectHBlur.uniforms[ 'h' ].value = 2 / ( width / 2 );
	effectVBlur.uniforms[ 'v' ].value = 2 / ( height / 2 );
	var effectColorify1 = new ShaderPass( ColorifyShader );
	var effectColorify2 = new ShaderPass( ColorifyShader );
	effectColorify1.uniforms[ 'color' ] = new THREE.Uniform(
		new THREE.Color( 1, 0.8, 0.8 )
	);
	effectColorify2.uniforms[ 'color' ] = new THREE.Uniform(
		new THREE.Color( 1, 0.75, 0.5 )
	);
	var clearMask = new ClearMaskPass();
	var renderMask = new MaskPass( sceneModel, cameraPerspective );
	var renderMaskInverse = new MaskPass( sceneModel, cameraPerspective );
	renderMaskInverse.inverse = true;
	//
	var rtParameters = {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat,
		stencilBuffer: true
	};
	var rtWidth = width / 2;
	var rtHeight = height / 2;
	//
	var renderBackground = new RenderPass( sceneBG, cameraOrtho );
	var renderModel = new RenderPass( sceneModel, cameraPerspective );
	renderModel.clear = false;
	composerScene = new EffectComposer(
		renderer,
		new THREE.WebGLRenderTarget( rtWidth * 2, rtHeight * 2, rtParameters )
	);
	composerScene.addPass( renderBackground );
	composerScene.addPass( renderModel );
	composerScene.addPass( renderMaskInverse );
	composerScene.addPass( effectHBlur );
	composerScene.addPass( effectVBlur );
	composerScene.addPass( clearMask );
	//
	renderScene = new TexturePass( composerScene.renderTarget2.texture );
	//
	composer1 = new EffectComposer(
		renderer,
		new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters )
	);
	composer1.addPass( renderScene );
	//composer1.addPass( renderMask );
	composer1.addPass( effectFilmBW );
	//composer1.addPass( clearMask );
	composer1.addPass( effectVignette );
	//
	composer2 = new EffectComposer(
		renderer,
		new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters )
	);
	composer2.addPass( renderScene );
	composer2.addPass( effectDotScreen );
	composer2.addPass( renderMask );
	composer2.addPass( effectColorify1 );
	composer2.addPass( clearMask );
	composer2.addPass( renderMaskInverse );
	composer2.addPass( effectColorify2 );
	composer2.addPass( clearMask );
	composer2.addPass( effectVignette );
	//
	composer3 = new EffectComposer(
		renderer,
		new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters )
	);
	composer3.addPass( renderScene );
	//composer3.addPass( renderMask );
	composer3.addPass( effectSepia );
	composer3.addPass( effectFilm );
	//composer3.addPass( clearMask );
	composer3.addPass( effectVignette );
	//
	composer4 = new EffectComposer(
		renderer,
		new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters )
	);
	composer4.addPass( renderScene );
	//composer4.addPass( renderMask );
	composer4.addPass( effectBloom );
	composer4.addPass( effectFilm );
	composer4.addPass( effectBleach );
	//composer4.addPass( clearMask );
	composer4.addPass( effectVignette );
	renderScene.uniforms[ "tDiffuse" ].value = composerScene.renderTarget2.texture;
	window.addEventListener( 'resize', onWindowResize, false );
}
function onWindowResize() {
	halfWidth = window.innerWidth / 2;
	halfHeight = window.innerHeight / 2;
	cameraPerspective.aspect = window.innerWidth / window.innerHeight;
	cameraPerspective.updateProjectionMatrix();
	cameraOrtho.left = -halfWidth;
	cameraOrtho.right = halfWidth;
	cameraOrtho.top = halfHeight;
	cameraOrtho.bottom = -halfHeight;
	cameraOrtho.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	composerScene.setSize( halfWidth * 2, halfHeight * 2 );
	composer1.setSize( halfWidth, halfHeight );
	composer2.setSize( halfWidth, halfHeight );
	composer3.setSize( halfWidth, halfHeight );
	composer4.setSize( halfWidth, halfHeight );
	renderScene.uniforms[ "tDiffuse" ].value = composerScene.renderTarget2.texture;
	quadBG.scale.set( window.innerWidth, window.innerHeight, 1 );
	quadMask.scale.set( window.innerWidth / 2, window.innerHeight / 2, 1 );
}
function createMesh( geometry, scene, scale ) {
	var mat2 = new THREE.MeshPhongMaterial( {
		color: 0x999999,
		specular: 0x080808,
		shininess: 20,
		map: new THREE.TextureLoader().load( __dirname + "/textures/Map-COL.jpg" ),
		normalMap: new THREE.TextureLoader().load(
			__dirname + "/textures/Infinite-Level_02_Tangent_SmoothUV.jpg"
		),
		normalScale: new THREE.Vector2( 0.75, 0.75 )
	} );
	mesh = new THREE.Mesh( geometry, mat2 );
	mesh.position.set( 0, -50, 0 );
	mesh.scale.set( scale, scale, scale );
	scene.add( mesh );
}
//
function animate() {
	requestAnimationFrame( animate );
	render();
}
function render() {
	var time = Date.now() * 0.0004;
	if ( mesh ) mesh.rotation.y = -time;
	renderer.setViewport( 0, 0, halfWidth, halfHeight );
	composerScene.render( delta );
	renderer.setViewport( 0, 0, halfWidth, halfHeight );
	composer1.render( delta );
	renderer.setViewport( halfWidth, 0, halfWidth, halfHeight );
	composer2.render( delta );
	renderer.setViewport( 0, halfHeight, halfWidth, halfHeight );
	composer3.render( delta );
	renderer.setViewport( halfWidth, halfHeight, halfWidth, halfHeight );
	composer4.render( delta );
}
