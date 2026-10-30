    const rejected = received - accepted;
    const reason = line.rejectionReason?.trim() || null;
    if (rejected > 0 && !reason) return { ok: false, error: "ACCEPTED_QUANTITY_DOES_NOT_MATCH" };
