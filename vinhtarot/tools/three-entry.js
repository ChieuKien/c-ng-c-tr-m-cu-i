// Danh sách export của three.js mà trang thực sự dùng → esbuild tree-shake còn ~1/2 dung lượng.
// Thêm tên vào đây nếu code mới dùng thêm lớp nào của THREE, rồi chạy lại lệnh build trong README.
export {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BackSide, BoxGeometry, BufferAttribute, BufferGeometry,
  CanvasTexture, Color, DirectionalLight, Euler, ExtrudeGeometry, FogExp2, Group, HemisphereLight, InstancedMesh,
  MathUtils, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera,
  PMREMGenerator, PointLight, Points, Quaternion, Raycaster, Scene, ShaderMaterial, Shape, Sprite, SpriteMaterial,
  SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer,
} from 'three';
