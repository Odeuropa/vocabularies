import axios from 'axios';
import levenshtein from 'js-levenshtein';

const uri = 'http://iconclass.org/rkd/0/';
const BRACKETS = /[<()>]/g;
const BRACKETS_CONTENT = /[<(].+[)>]/g;

export function search(term) {
  const q = term.replaceAll(BRACKETS, '');
  console.log(q);
  return axios.get(uri, {
    params: {
      q,
      q_s: 1,
      fmt: 'json',
    },
  })
    .then((response) => {
      const { records } = response.data;
      let id = '';
      let label = '';
      let score = 2000;
      for (const rec of records) {
        const lb = rec.txt.en;
        const newScore = levenshtein(lb.replaceAll(BRACKETS_CONTENT, ''), q);
        if (newScore < score) {
          score = newScore;
          label = lb;
          id = rec.p.pop();
        }
      }
      return { id, label };
    })
    .catch((error) => {
      if (!error.response || error.response.status !== 500) console.error(error);
      return { id: '', label: '' };
    });
}
