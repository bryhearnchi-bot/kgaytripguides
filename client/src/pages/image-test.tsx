export default function ImageTest() {
  return (
    <div style={{ padding: '20px', background: 'white' }}>
      <h1>Image Test Page</h1>

      <h2>Test 1: Inline Supabase Storage Image</h2>
      <img
        src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-scarlet-lady.jpg"
        alt="Test Ship"
        style={{ width: '300px', border: '2px solid red' }}
      />

      <h2>Test 2: Logo from Supabase Storage</h2>
      <img
        src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/logos/atlantis-logo.png"
        alt="Logo"
        style={{ width: '200px', border: '2px solid blue' }}
      />

      <h2>Test 3: Background Image</h2>
      <div
        style={{
          width: '300px',
          height: '200px',
          border: '2px solid green',
          backgroundImage: 'url(https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/unite.jpg)',
          backgroundSize: 'cover'
        }}
      >
        Background Image Test
      </div>
    </div>
  );
}