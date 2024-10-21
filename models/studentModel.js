import mongoose from "mongoose";

const Schema = mongoose.Schema;

const studentSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    fin: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
    },
    seria: {
      type: String,
    },
    birthday: {
      type: Date,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      default: "student",
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    whereComing: {
      type: String,
      // enum: ["instagram", "referral", "event", "externalAds", "other"],
      default: "other",
    },
    whereSend: {
      type: String,
      // enum: ["instagram", "referral", "event", "externalAds", "other"],
      default: "sale",
    },
    groups: [
      {
        group: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Group",
        },

        contracts: [
          {
            contractStartDate: {
              type: Date,
            },
            contractEndDate: {
              type: Date,
            },
            contractId: {
              type: Number,
            },
            paymentStartDate: {
              type: Date,
            },
            monthlyPayment: {
              type: Number,
            },
          },
        ],

        paids: [
          {
            payment: {
              type: Number,
            },
            paymentDate: {
              type: Date,
            },
            confirmed: {
              type: Boolean,
              default: false,
            },
            discountReason: {
              type: String,
            },
            discount: {
              type: Number,
            },
          },
        ],
        // contractEndDate: {
        //   type: Date,
        // },
        // payment: {
        //   type: Object,
        // },
        // paymentPart: {
        //   type: Number,
        // },
        // amount: {
        //   type: Number,
        // },
        // totalAmount: {
        //   type: Number,
        // },
        // discountReason: {
        //   type: String,
        // },
        // discount: {
        //   type: Number,
        // },
        // cvLink: {
        //   type: String,
        // },
        // portfolioLink: {
        //   type: String,
        // },
        // workStatus: {
        //   type: Array,
        // },
        // previousWorkPlace: {
        //   type: String,
        // },
        // previousWorkPosition: {
        //   type: String,
        // },
        // currentWorkPlace: {
        //   type: String,
        // },
        // currentWorkPosition: {
        //   type: String,
        // },
        // workStartDate: {
        //   type: Date,
        // },
        diplomaStatus: {
          type: String,
          enum: [
            "none",
            "send-design",
            "designed",
            "send-print",
            "in-academy",
            "awarded",
          ],
          default: "none",
        },
        diplomaDegree: {
          type: String,
          enum: ["certificate", "simple", "honor", "none"],
          default: "none",
        },
        diplomaDate: {
          type: Date,
        },

        status: {
          type: String,
          default: "continue",
          enum: ["graduate", "continue", "stopped", "freeze"],
        },
        // degree: {
        //   type: String,
        // },
        // payments: [
        //   {
        //     payment: {
        //       type: Number,
        //     },
        //     paymentDate: {
        //       type: Date,
        //     },
        //     status: {
        //       type: String,
        //       default: "wait",
        //       enum: ["wait", "paid"],
        //     },
        //   },
        // ],
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    changes: {
      type: Object,
    },
  },
  { timestamps: true }
);

studentSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.fin) {
    update.fin = update.fin.toUpperCase();
  }
  next();
});
studentSchema.pre("save", function (next) {
  if (this.fin) {
    this.fin = this.fin.toUpperCase();
  }
  next();
});

studentSchema.index({ createdAt: 1 });

export const Student = mongoose.model("Student", studentSchema);
