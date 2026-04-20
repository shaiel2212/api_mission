export type ProjectCategory = "renovation" | "construction" | "office";

export type Project = {
  id: string;
  title: string;
  category: ProjectCategory;
  workType: string;
  description: string;
  beforeImage: string;
  afterImage: string;
};

const img = (seed: string) => `https://picsum.photos/seed/artel-${seed}/1000/700`;

/** דוגמאות להדגמת מבנה — להחליף בתמונות וטקסטים אמיתיים מהלקוח */

export const projects: Project[] = [
  {
    id: "p1",
    title: "פנטהאוז בתל אביב",
    category: "renovation",
    workType: "שיפוץ יוקרה",
    description: "שדרוג מלא של חללי מגורים, חומרי גמר פרימיום ותאורה אדריכלית.",
    beforeImage: img("1600585154349-be6186142566"),
    afterImage: img("1600607687939-ce8a6c25118c"),
  },
  {
    id: "p2",
    title: "משרדי הייטק",
    category: "office",
    workType: "שיפוץ משרדים",
    description: "תכנון וביצוע חללי עבודה פתוחים, חדרי ישיבות ואזורי קבלה.",
    beforeImage: img("1497366214758-6920dd0a369e"),
    afterImage: img("1604328698692-f76e949368e0"),
  },
  {
    id: "p3",
    title: "בית פרטי — השרון",
    category: "construction",
    workType: "בנייה פרטית",
    description: "בנייה מאפס תוך ליווי תכנון ובקרת איכות בכל שלב.",
    beforeImage: img("1600585152915-d208bec1cd99"),
    afterImage: img("1600566752355-35792f1333a"),
  },
];

export const categoryLabels: Record<ProjectCategory, string> = {
  renovation: "שיפוצים",
  construction: "בנייה",
  office: "משרדים",
};
