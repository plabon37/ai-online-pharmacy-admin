import { connectToDB } from "@/lib/connectToDB";
import Prescription from "@/lib/models/Prescription";

import PrescriptionPage from "@/components/prescriptions/PrescriptionPage";
import type { AdminPrescription } from "@/components/prescriptions/PrescriptionList";

type PrescriptionPageLoaderProps = {
  initialSearch?: string;
  initialStatus?: string;
};

const VALID_STATUSES = new Set([
  "PENDING",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
]);

export default async function PrescriptionPageLoader({
  initialSearch,
  initialStatus,
}: PrescriptionPageLoaderProps) {
  await connectToDB();

  const search =
    initialSearch?.trim() || "";

  const status =
    initialStatus &&
    VALID_STATUSES.has(initialStatus)
      ? initialStatus
      : "ALL";

  const filter: Record<string, unknown> =
    {};

  if (status !== "ALL") {
    filter.status = status;
  }

  if (search) {
    const User = (
      await import("@/lib/models/User")
    ).default;

    const escapedSearch =
      search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex = new RegExp(
      escapedSearch,
      "i"
    );

    const matchingUsers =
      await User.find({
        $or: [
          {
            name: regex,
          },
          {
            email: regex,
          },
        ],
      })
        .select("_id")
        .lean();

    const userIds =
      matchingUsers.map(
        (user) => user._id
      );

    const orConditions: Record<
      string,
      unknown
    >[] = [
      {
        patientName: regex,
      },
    ];

    if (userIds.length > 0) {
      orConditions.push({
        user: {
          $in: userIds,
        },
      });
    }

    if (
      /^[a-f\d]{24}$/i.test(search)
    ) {
      orConditions.push({
        _id: search,
      });
    }

    filter.$or = orConditions;
  }

  const prescriptions =
    await Prescription.find(filter)
      .populate({
        path: "user",
        select: "name email",
      })
      .populate({
        path: "reviewedBy",
        select: "name email role",
      })
      .sort({
        createdAt: -1,
      })
      .lean();

  const serializedPrescriptions: AdminPrescription[] =
    prescriptions.map(
      (prescription) => ({
        _id:
          prescription._id.toString(),

        user:
          prescription.user &&
          typeof prescription.user ===
            "object" &&
          "_id" in prescription.user
            ? {
                _id:
                  prescription.user._id.toString(),

                name:
                  "name" in
                  prescription.user
                    ? String(
                        prescription.user
                          .name || ""
                      )
                    : "",

                email:
                  "email" in
                  prescription.user
                    ? String(
                        prescription.user
                          .email || ""
                      )
                    : "",
              }
            : null,

        patientName:
          prescription.patientName,

        image:
          prescription.image || "",

        note:
          prescription.note || "",

        adminNote:
          prescription.adminNote || "",

        status:
          prescription.status,

        reviewedBy:
          prescription.reviewedBy &&
          typeof prescription.reviewedBy ===
            "object" &&
          "_id" in
            prescription.reviewedBy
            ? {
                _id:
                  prescription.reviewedBy._id.toString(),

                name:
                  "name" in
                  prescription.reviewedBy
                    ? String(
                        prescription
                          .reviewedBy
                          .name || ""
                      )
                    : "",

                email:
                  "email" in
                  prescription.reviewedBy
                    ? String(
                        prescription
                          .reviewedBy
                          .email || ""
                      )
                    : "",

                role:
                  "role" in
                  prescription.reviewedBy
                    ? String(
                        prescription
                          .reviewedBy
                          .role || ""
                      )
                    : "",
              }
            : null,

        reviewedAt:
          prescription.reviewedAt
            ? prescription.reviewedAt.toISOString()
            : null,

        createdAt:
          prescription.createdAt.toISOString(),

        updatedAt:
          prescription.updatedAt.toISOString(),
      })
    );

  return (
    <PrescriptionPage
      initialPrescriptions={
        serializedPrescriptions
      }
      initialSearch={search}
      initialStatus={status}
    />
  );
}