// The fake painter's head: a 64×64 cartoon face on flat magenta (#FF00FF), as a PNG in base64.
// It goes through the same keying as a real head (keyAndCropHead clears the magenta and crops to
// the face), so local dev and the portal's end-to-end run exercise the browser's whole finish.
// Drawn by a throwaway script once; the colours are skin, hair, ink and a mouth, nothing near
// the key. headPainter's tests decode it and prove it keys to a face.
export const FAKE_HEAD_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAABLElEQVR42u3awQ3CMAwF0D9IxRAcEaMwHJNwYiA2KBKUAwJa23Fsl/4ox0r8l1BE7GDEuOoJAggggAACCCDg3wCnw+7XLA2Yyd1PgvjovgxkRfdiID19owEV0rcYUCS92YA66W0GlEpvMKBaeq0BBdOrDJsBBKeXG7YBSEkvNIgAw2PcrufI+fxQAl7pswCLBtRcfvkmEPC+3YsPy58kgIASAOEb3AkgMfBXiAACCFgHYMX/Rrd1oLkc95KZA5AYvADC74+iKpEC8CyrRL7K8uXXVeaCAf6lxZhNUC2/ujrd26BNb+kP9DMY0hs7ND0MtvT2HpmvwZy+qUvpZWhJ39onVp1u58/HaZ167SH969E+/67E8DEkuRuj+99WGTSj9H2hgNy8sUUAAdO8A6OLQqIc+YPhAAAAAElFTkSuQmCC";

// A generateContent reply as Gemini sends one, carrying that head.
export const FAKE_GENERATE_CONTENT_RESPONSE = JSON.stringify({
  candidates: [
    {
      content: { role: "model", parts: [{ inlineData: { mimeType: "image/png", data: FAKE_HEAD_PNG_BASE64 } }] },
      finishReason: "STOP",
      index: 0
    }
  ],
  modelVersion: "fake"
});
