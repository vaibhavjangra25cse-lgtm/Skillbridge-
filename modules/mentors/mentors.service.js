const Mentor = require('../../models/Mentor');
const { findByIdOrLegacy, serializeMentor } = require('../../utils/records');
const escapeRegex = require('../../utils/escapeRegex');
const mentorFields = ['name', 'email', 'expertise', 'experience', 'bio', 'availability', 'department', 'year', 'rating', 'reviews', 'teaches', 'wantsToLearn', 'avatar', 'user'];
const mentorProfileFields = ['expertise', 'experience', 'bio', 'availability', 'teaches', 'wantsToLearn'];

function pickMentorFields(input) {
    return Object.fromEntries(mentorFields.filter(key => input[key] !== undefined).map(key => [key, input[key]]));
}

async function list({ search = '', expertise = '', department = '', year = '', experience = '' } = {}) {
    const filter = {};
    const conditions = [];
    if (expertise) {
        const terms = expertise.split(',').slice(0, 20).map(term => new RegExp(escapeRegex(term.trim()), 'i'));
        conditions.push({ $or: [{ expertise: { $in: terms } }, { teaches: { $in: terms } }] });
    }
    const safeSearch = escapeRegex(search);
    if (search) conditions.push({ $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { bio: { $regex: safeSearch, $options: 'i' } },
        { teaches: { $regex: safeSearch, $options: 'i' } },
        { expertise: { $regex: safeSearch, $options: 'i' } },
    ] });
    if (department) conditions.push({ $or: [
        { department: { $regex: escapeRegex(department), $options: 'i' } },
        { bio: { $regex: escapeRegex(department), $options: 'i' } },
    ] });
    if (year) conditions.push({ $or: [
        { year: { $regex: escapeRegex(year), $options: 'i' } },
        { bio: { $regex: escapeRegex(year), $options: 'i' } },
    ] });
    if (experience) filter.experience = { $regex: escapeRegex(experience), $options: 'i' };
    if (conditions.length) filter.$and = conditions;
    const mentors = await Mentor.find(filter).sort({ legacyId: 1, rating: -1 }).limit(500).lean();
    return mentors.map(mentor => serializePublicMentor(mentor));
}

async function getById(id) {
    const mentor = await findByIdOrLegacy(Mentor, id);
    return mentor ? serializePublicMentor(mentor) : null;
}

async function getByUser(userId) {
    const mentor = await Mentor.findOne({ user: userId });
    return mentor ? serializeMentor(mentor) : null;
}

async function updateByUser(userId, input) {
    const mentor = await Mentor.findOne({ user: userId });
    if (!mentor) return null;
    Object.assign(mentor, Object.fromEntries(
        mentorProfileFields
            .filter(key => input[key] !== undefined)
            .map(key => [
                key,
                key === 'expertise' && Array.isArray(input[key])
                    ? input[key].map(value => value.trim()).filter(Boolean)
                    : input[key],
            ])
    ));
    await mentor.save();
    return serializeMentor(mentor);
}

async function create(input) {
    return serializeMentor(await Mentor.create(pickMentorFields(input)));
}

async function update(id, input) {
    const mentor = await findByIdOrLegacy(Mentor, id);
    if (!mentor) return null;
    Object.assign(mentor, pickMentorFields(input));
    await mentor.save();
    return serializeMentor(mentor);
}

async function remove(id) {
    const mentor = await findByIdOrLegacy(Mentor, id);
    if (!mentor) return false;
    await mentor.deleteOne();
    return true;
}

function serializePublicMentor(mentor) {
    const value = typeof mentor.toObject === 'function' ? mentor.toObject() : mentor;
    const {
        _id, name, expertise, experience, bio, availability, department, year,
        rating, reviews, teaches, wantsToLearn,
    } = value;
    return {
        id: _id.toString(),
        name,
        expertise,
        experience,
        bio,
        availability,
        department,
        year,
        rating,
        reviews,
        teaches,
        wantsToLearn,
        avatar: serializePublicAvatar(value.avatar),
    };
}

function serializePublicAvatar(avatar) {
    if (!avatar || typeof avatar !== 'object') return null;
    const className = typeof avatar.className === 'string' && /^[a-zA-Z0-9 _-]{1,80}$/.test(avatar.className)
        ? avatar.className
        : '';
    if (
        avatar.type === 'image'
        && typeof avatar.src === 'string'
        && /^images\/(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9._/-]+\.(?:svg|png|jpe?g|webp)$/i.test(avatar.src)
    ) {
        return {
            type: 'image',
            src: avatar.src,
            alt: typeof avatar.alt === 'string' ? avatar.alt.slice(0, 200) : '',
            className,
        };
    }
    return {
        type: 'text',
        text: typeof avatar.text === 'string' ? avatar.text.slice(0, 8) : '',
        className,
        bgColor: typeof avatar.bgColor === 'string' && /^#[\da-f]{3,8}$/i.test(avatar.bgColor)
            ? avatar.bgColor
            : '',
    };
}

module.exports = { create, getById, getByUser, list, remove, serializePublicMentor, update, updateByUser };
