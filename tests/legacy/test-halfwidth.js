const hasHalfWidthPunctuation = /[\uff61-\uff65]/.test("芹云ミ､");
console.log("芹云ミ､", hasHalfWidthPunctuation);
console.log("攻撃力、", /[\uff61-\uff65]/.test("攻撃力、"));
