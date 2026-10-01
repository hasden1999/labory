import { NextResponse } from 'next/server';
import {
  getStore,
  getSpecialties,
  getTestGroups,
  addSpecialty,
  updateSpecialty,
  deleteSpecialty,
  addTestGroup,
  updateTestGroup,
  deleteTestGroup,
  updateTestSpecialty,
} from '../../../lib/serverStore';

export async function GET() {
  const store = getStore();
  const specialties = getSpecialties();
  const groups = getTestGroups();
  const tests = store.tests || [];

  const result = specialties
    .map(spec => {
      const specGroups = groups
        .filter(g => g.specialtyId === spec.id)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(grp => {
          const grpTests = tests
            .filter(t => t.specialtyId === spec.id && t.groupId === grp.id)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          return {
            ...grp,
            tests: grpTests,
            testCount: grpTests.length,
          };
        });

      const directTests = tests
        .filter(t => t.specialtyId === spec.id && !t.groupId)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      return {
        ...spec,
        groups: specGroups,
        directTests,
        totalTestCount: tests.filter(t => t.specialtyId === spec.id).length,
      };
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const unassignedTests = tests
    .filter(t => !t.specialtyId)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return NextResponse.json({
    specialties: result,
    groups,
    unassignedTests,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type || 'specialty';

    if (type === 'group') {
      if (!body.specialtyId) {
        return NextResponse.json({ message: 'معرف الاختصاص مطلوب' }, { status: 400 });
      }
      if (!body.nameEn?.trim()) {
        return NextResponse.json({ message: 'اسم المجموعة بالإنجليزية مطلوب' }, { status: 400 });
      }
      const grp = addTestGroup({
        specialtyId: body.specialtyId,
        nameEn: body.nameEn.trim(),
        nameAr: body.nameAr?.trim() || null,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== false,
      });
      return NextResponse.json(grp, { status: 201 });
    }

    // Default: add specialty
    if (!body.nameEn?.trim()) {
      return NextResponse.json({ message: 'اسم الاختصاص بالإنجليزية مطلوب' }, { status: 400 });
    }
    const spec = addSpecialty({
      nameEn: body.nameEn.trim(),
      nameAr: body.nameAr?.trim() || null,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      isActive: body.isActive !== false,
    });
    return NextResponse.json(spec, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'فشلت العملية' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const type = body.type || 'specialty';

    if (type === 'assign-test') {
      if (!body.testId) {
        return NextResponse.json({ message: 'معرف الفحص مطلوب' }, { status: 400 });
      }
      const updated = updateTestSpecialty(body.testId, {
        specialtyId: body.specialtyId || null,
        groupId: body.groupId || null,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : null,
      });
      return NextResponse.json(updated);
    }

    if (type === 'group') {
      if (!body.id) {
        return NextResponse.json({ message: 'معرف المجموعة مطلوب' }, { status: 400 });
      }
      const updated = updateTestGroup(body.id, {
        nameEn: body.nameEn,
        nameAr: body.nameAr,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      });
      return NextResponse.json(updated);
    }

    // Default: update specialty
    if (!body.id) {
      return NextResponse.json({ message: 'معرف الاختصاص مطلوب' }, { status: 400 });
    }
    const updated = updateSpecialty(body.id, {
      nameEn: body.nameEn,
      nameAr: body.nameAr,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'فشلت العملية' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'specialty';

    if (!id) {
      return NextResponse.json({ message: 'المعرف مطلوب' }, { status: 400 });
    }

    if (type === 'group') {
      const res = deleteTestGroup(id);
      return NextResponse.json(res);
    }

    const res = deleteSpecialty(id);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'فشلت العملية' }, { status: 500 });
  }
}
