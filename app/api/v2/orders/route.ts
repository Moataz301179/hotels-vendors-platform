 if (typeof change.orderItemId !== "string" || typeof change.quantity !== "number" || typeof change.unitPrice !== "number" || !(change.deliveryDate === null || typeof change.deliveryDate === "string" || change.deliveryDate === undefined)) {
  return NextResponse.json({ error: "INVALID_PO_CHANGE" }, { status: 400 });
 }
 if (typeof change.deliveryDate === "string" && change.deliveryDate.length > 0 && !day(change.deliveryDate)) return NextResponse.json({ error: "INVALID_PO_CHANGE" }, { status: 400 });
