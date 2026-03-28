function testTimeConversion() {
    const tzOffset = 330; // IST (+5:30)
    const dateStr = "2026-03-29";
    const startTimeStr = "09:00";
    
    // Simulate the logic in aiController.js
    const startDateLocal = new Date(`${dateStr}T00:00:00Z`);
    const [startH, startM] = startTimeStr.split(':').map(Number);
    
    // startTimeUtc = startDateLocal + (H * 60 + M - offset) * 60 * 1000
    const startTimeUtc = new Date(startDateLocal.getTime() + (startH * 60 + startM - tzOffset) * 60 * 1000);
    
    console.log("Input Date:", dateStr);
    console.log("Input Local Time:", startTimeStr);
    console.log("Offset:", tzOffset);
    console.log("Calculated UTC Time:", startTimeUtc.toISOString());
    
    // Expected: 9:00 AM IST is 3:30 AM UTC
    const expected = "2026-03-29T03:30:00.000Z";
    if (startTimeUtc.toISOString() === expected) {
        console.log("SUCCESS: Time conversion is correct.");
    } else {
        console.log("FAILURE: Expected " + expected + " but got " + startTimeUtc.toISOString());
    }
}

testTimeConversion();
