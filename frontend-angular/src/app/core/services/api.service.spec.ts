import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '@env/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Projects', () => {
    it('should get projects', () => {
      const mockProjects = [{ id: '1', name: 'Test Project' }];

      service.getProjects().subscribe(projects => {
        expect(projects.length).toBe(1);
        expect(projects[0].name).toBe('Test Project');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });

    it('should create project', () => {
      const newProject = { name: 'New Project', code: 'NP' };

      service.createProject(newProject).subscribe(project => {
        expect(project.name).toBe('New Project');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProject);
      req.flush({ id: '2', ...newProject });
    });

    it('should get project by id', () => {
      service.getProject('1').subscribe(project => {
        expect(project.id).toBe('1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: '1', name: 'Test' });
    });
  });

  describe('Scripts', () => {
    it('should get scripts', () => {
      service.getScripts().subscribe(scripts => {
        expect(scripts).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/scripts`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should create script', () => {
      const newScript = { projectId: '1', title: 'New Script' };

      service.createScript(newScript).subscribe(script => {
        expect(script.title).toBe('New Script');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/scripts`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: '1', ...newScript });
    });

    it('should update script', () => {
      const update = { title: 'Updated Title' };

      service.updateScript('1', update).subscribe(script => {
        expect(script.title).toBe('Updated Title');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/scripts/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ id: '1', ...update });
    });

    it('should get script versions', () => {
      service.getScriptVersions('1').subscribe(versions => {
        expect(versions).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/scripts/1/versions`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should add comment', () => {
      service.addScriptComment('1', 'Test comment').subscribe(comment => {
        expect(comment.body).toBe('Test comment');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/scripts/1/comments`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: '1', body: 'Test comment' });
    });
  });

  describe('Auth', () => {
    it('should get current user', () => {
      service.getMe().subscribe(user => {
        expect(user.email).toBe('test@test.com');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: '1', email: 'test@test.com' });
    });
  });

  describe('Upload', () => {
    it('should upload file', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      service.upload(file).subscribe(result => {
        expect(result.url).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush({ url: 'http://example.com/test.txt', name: 'test.txt', size: 4 });
    });
  });
});
