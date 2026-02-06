async function Upload(base64, ipfs) {
    const base64Content = base64.replace(/^data:.+;base64,/, "");
    const fileBuffer = Buffer.from(base64Content, 'base64');
    const result = await ipfs.add(fileBuffer);
    return result.cid.toString();
}

