export default function ImageTest() {
  return (
    <div style={{ padding: '20px', background: 'white' }}>
      <h1>Image Test Page</h1>

      <h2>Test 1: Inline Cloudinary Image</h2>
      <img
        src="https://res.cloudinary.com/dfqoebbyj/image/upload/v1757789602/cruise-app/ships/virgin-scarlet-lady.jpg"
        alt="Test Ship"
        style={{ width: '300px', border: '2px solid red' }}
      />

      <h2>Test 2: Logo from Cloudinary</h2>
      <img
        src="https://res.cloudinary.com/dfqoebbyj/image/upload/v1757807911/cruise-app/logos/atlantis-logo.png"
        alt="Logo"
        style={{ width: '200px', border: '2px solid blue' }}
      />

      <h2>Test 3: Background Image</h2>
      <div
        style={{
          width: '300px',
          height: '200px',
          border: '2px solid green',
          backgroundImage: 'url(https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804284/unite_af3vyi.jpg)',
          backgroundSize: 'cover'
        }}
      >
        Background Image Test
      </div>
    </div>
  );
}