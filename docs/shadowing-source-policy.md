# Shadowing source policy

## Muc tieu

Kho shadowing can ho tro truoc 3 ngon ngu:

- English
- Japanese
- Korean

Moi clip nen co metadata:

- `language`
- `level`
- `duration`
- `source_type`: own_clip, licensed_clip, youtube_embed, common_voice_audio, dataset_sentence
- `rights`
- `caption_text`
- `translation`
- `start_ms`
- `end_ms`
- `focus`: pronunciation, rhythm, work, exam, daily

## Nguon nen dung cho MVP

1. Clip tu tao

- An toan nhat cho thuong mai.
- De tao subtitle, ban dich, cau shadowing.
- Phu hop English, Japanese, Korean.

2. Common Voice

- Phu hop cho audio shadowing va speech dataset.
- Khong phai video, nhung dung tot cho phat am/cau ngan.
- Can tuan thu license va attribution.

3. YouTube embed co chon loc

- Chi embed, khong tai lai video trai phep.
- Chi dung clip co quyen embed va subtitle hop le.
- Khong crawl subtitle/lyrics neu khong co quyen.

4. Dataset subtitle

- Dung de phan tich cau, tan suat tu, goi y vocabulary.
- Khong nen mac dinh bien thanh kho video hoc thuong mai neu license/rights chua ro.

## Nguon can can than

- Movie/TV subtitles: co the huu ich cho NLP, nhung video goc va subtitle co the vướng ban quyen.
- Lyrics bai hat: can provider licensed. Khong crawl tu web loi bai hat.
- Playlist Spotify: nen tich hop qua OAuth/API/embed, khong tai lai audio.

## Chien luoc trien khai

MVP:

- Tao 6-12 clip ngan tu tao cho English/Japanese/Korean.
- Moi clip 1-3 phut.
- Subtitle song ngu.
- Loop tung cau.
- Record voice local bang Web Speech API.

Beta:

- Them Common Voice audio clips cho phat am.
- Them YouTube embed curated neu co rights.
- Admin import subtitle VTT/SRT.

Scale:

- Hop dong noi dung/licensed media.
- Provider lyrics/subtitles licensed.
- Speech scoring nang cao theo phoneme.
