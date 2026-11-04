export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const previewSize = 60;
export const fileImage = (file) => file.image || file.entry.image;

export async function orderImage(files, offset, title) {
  const canvas = document.createElement('canvas');
  const rowHeight = 68;
  canvas.width = 1200;
  canvas.height = 76 + rowHeight * files.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const images = new Map();
  for (const file of files) {
    const url = fileImage(file);
    if (!url || images.has(url)) continue;
    const image = new Image();
    image.src = url;
    images.set(
      url,
      image.decode().then(
        () => image,
        () => null,
      ),
    );
  }
  ctx.fillStyle = '#101310';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 32px system-ui';
  ctx.fillStyle = '#f0f2eb';
  ctx.fillText(title, 24, 48, 1152);
  for (const [index, file] of files.entries()) {
    const y = 66 + index * rowHeight;
    ctx.fillStyle = '#20261f';
    ctx.fillRect(12, y, 1176, 62);
    ctx.font = 'bold 20px system-ui';
    ctx.fillStyle = '#b0d88f';
    ctx.fillText(String(offset + index + 1), 24, y + 38);
    const image = await images.get(fileImage(file));
    if (image) {
      const scale = Math.min(80 / image.naturalWidth, 52 / image.naturalHeight);
      ctx.drawImage(image, 84, y + 5, image.naturalWidth * scale, image.naturalHeight * scale);
    }
    ctx.font = 'bold 22px system-ui';
    ctx.fillStyle = '#f0f2eb';
    ctx.fillText(file.name, 178, y + 26, 990);
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#aeb6ab';
    ctx.fillText(file.filename || file.key, 178, y + 49, 990);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG unavailable')))),
  );
}
