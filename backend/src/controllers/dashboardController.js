import { Donation } from "../models/Donation.js";
import { NGO } from "../models/NGO.js";
export async function summary(_req, res, next) {
  try {
    const donations = await Donation.find();
    const values = donations.reduce((sum, donation) => { sum.kgDonated += donation.quantityKg; sum.risk += donation.riskScore; if (donation.status === "DELIVERED") sum.kgDelivered += donation.quantityKg; if (donation.status === "DISCARDED") sum.kgDiscarded += donation.quantityKg; return sum; }, { kgDonated: 0, kgDelivered: 0, kgDiscarded: 0, risk: 0 });
    return res.json({ kgDonated: values.kgDonated, kgDelivered: values.kgDelivered, kgDiscarded: values.kgDiscarded, avgSpoilageRisk: donations.length ? values.risk / donations.length : 0, ngosServed: await NGO.countDocuments() });
  } catch (error) { return next(error); }
}
